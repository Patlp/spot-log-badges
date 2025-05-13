
// Only modifying the necessary part of LeaderboardPage to ensure avatars display correctly

import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../App";
import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "../lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, MapPin, Award } from "lucide-react";

const LeaderboardPage = () => {
  const { user } = useContext(AuthContext);

  const { data: leaderboard, isLoading, refetch: refetchLeaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
  });

  // Refresh leaderboard when focused to ensure we have the latest avatar updates
  useEffect(() => {
    const onFocus = () => {
      refetchLeaderboard();
    };
    
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetchLeaderboard]);

  const getInitials = (username?: string) => {
    if (!username) return "U";
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-yellow-500";
      case 2:
        return "bg-gray-300";
      case 3:
        return "bg-amber-700";
      default:
        return "bg-gray-100";
    }
  };

  const getRankBg = (position: number) => {
    switch (position) {
      case 1:
        return "bg-yellow-100 text-yellow-800 border-yellow-500";
      case 2:
        return "bg-gray-100 text-gray-800 border-gray-400";
      case 3:
        return "bg-amber-100 text-amber-800 border-amber-700";
      default:
        return "bg-white text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground mt-2">
          Who's been exploring the most? Check out our top adventurers.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-center">
            <Trophy className="mr-2 h-5 w-5 text-presence-accent" />
            Top Explorers
          </CardTitle>
          <CardDescription className="text-center">
            Ranked by total check-ins
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-[200px] mb-2" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboard.map((profile, index) => {
                const isCurrentUser = profile.id === user?.id;
                const position = index + 1;

                return (
                  <Link
                    key={profile.id}
                    to={`/profile/${profile.id}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      getRankBg(position)
                    } ${isCurrentUser ? "border-presence-primary border-2" : ""} hover:bg-opacity-80`}
                  >
                    {/* Rank */}
                    <div className={`h-8 w-8 rounded-full ${getMedalColor(position)} flex items-center justify-center text-white font-bold`}>
                      {position}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={profile.avatar_url || ""} />
                      <AvatarFallback>
                        {getInitials(profile.username)}
                      </AvatarFallback>
                    </Avatar>

                    {/* User info */}
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className="font-medium">
                          {profile.username}
                          {isCurrentUser && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              You
                            </Badge>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center">
                          <MapPin className="mr-1 h-3 w-3" />
                          {profile.total_check_ins} check-ins
                        </span>
                        <span className="flex items-center">
                          <Award className="mr-1 h-3 w-3" />
                          {profile.total_badges} badges
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-lg font-bold">
                      {profile.unique_venues}
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        places
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground opacity-40" />
              <h3 className="mt-4 text-lg font-medium">No explorers yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Be the first to check in and top the leaderboard!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-muted rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium mb-2">How to climb the ranks?</h2>
        <p className="text-muted-foreground mb-4">
          Check in at more places to increase your total and earn badges. Every unique venue counts!
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-presence-soft-blue p-2 mb-2">
              <MapPin className="h-5 w-5 text-presence-primary" />
            </div>
            <p className="text-sm font-medium">Check in regularly</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-presence-soft-pink p-2 mb-2">
              <Award className="h-5 w-5 text-presence-primary" />
            </div>
            <p className="text-sm font-medium">Earn more badges</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-presence-primary bg-opacity-10 p-2 mb-2">
              <Trophy className="h-5 w-5 text-presence-primary" />
            </div>
            <p className="text-sm font-medium">Visit new places</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
