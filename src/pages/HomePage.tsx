
import { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../App";
import { supabase, getAllCheckIns } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, CalendarDays, Clock, Award } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

const HomePage = () => {
  const { user } = useContext(AuthContext);
  const [welcomeMessage, setWelcomeMessage] = useState("");

  useEffect(() => {
    const getWelcomeMessage = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good morning";
      if (hour < 18) return "Good afternoon";
      return "Good evening";
    };

    setWelcomeMessage(getWelcomeMessage());
  }, []);

  const { data: checkIns, isLoading } = useQuery({
    queryKey: ["allCheckIns"],
    queryFn: () => getAllCheckIns(20)
  });

  // Get a user's initials for the avatar fallback
  const getInitials = (username?: string) => {
    if (!username) return "U";
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Function to format the time (e.g., "2 hours ago")
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };

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

      {/* Check-ins Feed */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Check-ins</h2>
          <Button variant="outline" size="sm" asChild>
            <Link to="/leaderboard">View Leaderboard</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {checkIns && checkIns.map((checkIn: any) => (
              <Card key={checkIn.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={checkIn.profiles?.avatar_url || ''} />
                        <AvatarFallback>{getInitials(checkIn.profiles?.username)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link to={`/profile/${checkIn.user_id}`} className="font-medium hover:underline">
                          {checkIn.profiles?.username || 'Anonymous'}
                        </Link>
                        <p className="text-sm text-gray-500">
                          checked in at {checkIn.venue_name}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      {checkIn.venue_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <MapPin className="mr-1 h-4 w-4" />
                    <span>{checkIn.location}</span>
                  </div>
                  {checkIn.notes && <p className="text-sm mt-1">{checkIn.notes}</p>}
                </CardContent>
                <CardFooter className="pt-0 text-xs text-muted-foreground border-t">
                  <div className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>{formatTimeAgo(checkIn.check_in_time)}</span>
                  </div>
                </CardFooter>
              </Card>
            ))}

            {checkIns && checkIns.length === 0 && (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">No check-ins yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Be the first to check in somewhere new!
                    </p>
                    <Button className="mt-4" asChild>
                      <Link to="/check-in">Check In Now</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
