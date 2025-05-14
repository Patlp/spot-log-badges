
import { useContext, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../App";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

const HomePage = () => {
  const { user } = useContext(AuthContext);
  const [welcomeMessage, setWelcomeMessage] = useState("");

  // Use useCallback to prevent recreation of this function on every render
  const getWelcomeMessage = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  useEffect(() => {
    setWelcomeMessage(getWelcomeMessage());
  }, [getWelcomeMessage]);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-presence-primary to-presence-secondary rounded-xl p-6 text-white shadow-lg">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {welcomeMessage}, {user?.user_metadata?.username || 'Explorer'}!
          </h1>
          <p className="text-lg opacity-90 mb-4">
            Ready to check in somewhere new today?
          </p>
          <Button 
            asChild
            variant="secondary"
            className="bg-white text-presence-primary hover:bg-gray-100"
          >
            <Link to="/check-in">
              <MapPin className="mr-2 h-4 w-4" />
              Check In Now
            </Link>
          </Button>
        </div>
      </section>

      {/* Leaderboard Button Section */}
      <section className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link to="/leaderboard">View Leaderboard</Link>
        </Button>
      </section>
    </div>
  );
};

export default HomePage;
