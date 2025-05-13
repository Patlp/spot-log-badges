
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useMemo } from "react";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import CheckInPage from "./pages/CheckInPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import { User } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";

// Create a context for user authentication
export const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}>({
  user: null,
  loading: true,
  signOut: async () => {},
});

// Configure React Query with default settings to prevent excessive renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session when the app loads
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        setLoading(false);

        // Set up listener for auth state changes
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          (_event, session) => {
            setUser(session?.user || null);
          }
        );

        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error("Auth error:", error);
        setLoading(false);
      }
    };

    getSession();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Use useMemo for the context value to prevent unnecessary re-renders
  const authContextValue = useMemo(() => ({
    user,
    loading,
    signOut
  }), [user, loading]);

  // Don't render routes until we've checked if the user is logged in
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-t-presence-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authContextValue}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={
                user ? <Navigate to="/" replace /> : <AuthPage />
              } />
              
              <Route element={<Layout />}>
                <Route path="/" element={
                  user ? <HomePage /> : <Navigate to="/auth" replace />
                } />
                <Route path="/profile/:id?" element={
                  user ? <ProfilePage /> : <Navigate to="/auth" replace />
                } />
                <Route path="/check-in" element={
                  user ? <CheckInPage /> : <Navigate to="/auth" replace />
                } />
                <Route path="/leaderboard" element={
                  user ? <LeaderboardPage /> : <Navigate to="/auth" replace />
                } />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
