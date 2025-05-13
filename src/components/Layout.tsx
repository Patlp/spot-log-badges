
import { Outlet, useLocation, Link } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../App";
import { Button } from "@/components/ui/button";
import { MapPin, User, Trophy, Home, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const Layout = () => {
  const { user, signOut } = useContext(AuthContext);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navItems = [
    { path: "/", label: "Home", icon: <Home className="mr-2 h-4 w-4" /> },
    { path: "/profile", label: "Profile", icon: <User className="mr-2 h-4 w-4" /> },
    { path: "/check-in", label: "Check In", icon: <MapPin className="mr-2 h-4 w-4" /> },
    { path: "/leaderboard", label: "Leaderboard", icon: <Trophy className="mr-2 h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm border-b dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <MapPin className="h-6 w-6 text-presence-primary" />
              <span className="ml-2 text-xl font-bold text-presence-primary">Presence</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location.pathname === item.path
                      ? "bg-presence-primary bg-opacity-10 text-presence-primary"
                      : "text-gray-600 hover:bg-presence-primary hover:bg-opacity-10 hover:text-presence-primary"
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}

              {user && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={signOut}
                  className="ml-4"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              )}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMobileMenu}
                className="text-gray-600"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden bg-white dark:bg-gray-900 border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors",
                    location.pathname === item.path
                      ? "bg-presence-primary bg-opacity-10 text-presence-primary"
                      : "text-gray-600 hover:bg-presence-primary hover:bg-opacity-10 hover:text-presence-primary"
                  )}
                  onClick={closeMobileMenu}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}

              {user && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    signOut();
                    closeMobileMenu();
                  }}
                  className="w-full justify-start"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>© 2023 Presence. All rights reserved.</p>
            <p className="mt-1">Check in and earn badges at your favorite places.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
