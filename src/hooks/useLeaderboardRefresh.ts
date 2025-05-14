
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAccurateLeaderboard } from "../lib/supabase";
import { toast } from "@/components/ui/use-toast";

export const useLeaderboardRefresh = () => {
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const MAX_REFRESH_ATTEMPTS = 3;

  // Use the getAccurateLeaderboard function with a timestamp-based key for forced refreshes
  const { 
    data: leaderboard, 
    isLoading, 
    isError,
    error, 
    refetch: refetchLeaderboard 
  } = useQuery({
    queryKey: ["accurate-leaderboard", lastRefreshTime],
    queryFn: getAccurateLeaderboard,
    staleTime: 0, // Consider data always stale to ensure fresh fetches
    refetchOnWindowFocus: true, // Always refetch when window gets focus
    refetchOnMount: 'always', // Always refetch when component mounts
    retry: 2, // Retry failed requests twice
    refetchInterval: false, // Don't auto-refetch at intervals (we'll handle this manually)
    onError: (err) => {
      console.error("Error fetching leaderboard data:", err);
      // Show error toast only on first attempt to avoid spamming
      if (refreshAttempts === 0) {
        toast({
          title: "Failed to refresh leaderboard",
          description: "We're having trouble updating the leaderboard right now. Trying again...",
          variant: "destructive",
        });
      }
      setRefreshAttempts(prev => prev + 1);
    }
  });

  // Manual refresh function that can be called by components
  const manualRefresh = () => {
    console.log("Manual refresh triggered");
    setLastRefreshTime(Date.now());
    setRefreshAttempts(0);
    
    toast({
      title: "Refreshing leaderboard",
      description: "Fetching the latest explorer data...",
    });
  };

  // Enhanced refresh on window focus with timestamp update to force new data
  useEffect(() => {
    const onFocus = () => {
      console.log("Window focused, refreshing leaderboard");
      setLastRefreshTime(Date.now());
      setRefreshAttempts(0);
    };
    
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Immediate refresh on mount with timestamp update
  useEffect(() => {
    // Force an immediate refresh on component mount
    console.log("Component mounted, refreshing leaderboard");
    refetchLeaderboard();
  }, [refetchLeaderboard]);

  // Poll for updates more frequently (every 10 seconds) to keep data fresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("Polling interval, refreshing leaderboard");
      setLastRefreshTime(Date.now());
      setRefreshAttempts(0);
    }, 10000); // 10 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  return {
    leaderboard,
    isLoading,
    isError,
    error,
    refetchLeaderboard: manualRefresh,
    lastRefreshTime
  };
};
