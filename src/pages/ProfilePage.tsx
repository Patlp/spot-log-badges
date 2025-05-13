
import { useContext, useState } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../App";
import { useQuery } from "@tanstack/react-query";
import { getProfile, getCheckIns, getUserBadges } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MapPin, Award, CheckCircle, Trophy, Star, Flag, User } from "lucide-react";
import { format } from "date-fns";
import EditProfileDialog from "@/components/profile/EditProfileDialog";

const ProfilePage = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const userId = id || user?.id || '';
  const isOwnProfile = userId === user?.id;
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Badge icons mapping
  const badgeIcons: Record<string, any> = {
    "first_visit": <MapPin className="h-5 w-5" />,
    "regular": <Star className="h-5 w-5" />,
    "explorer": <Flag className="h-5 w-5" />,
    "adventurer": <Trophy className="h-5 w-5" />,
  };

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", userId, refetchTrigger],
    queryFn: () => getProfile(userId),
    enabled: !!userId,
  });

  const { data: checkIns, isLoading: checkInsLoading } = useQuery({
    queryKey: ["checkIns", userId, refetchTrigger],
    queryFn: () => getCheckIns(userId, 10),
    enabled: !!userId,
  });

  const { data: badges, isLoading: badgesLoading } = useQuery({
    queryKey: ["badges", userId, refetchTrigger],
    queryFn: () => getUserBadges(userId),
    enabled: !!userId,
  });

  const handleProfileUpdated = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  const getInitials = (username?: string) => {
    if (!username) return "U";
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getBadgeColor = (badgeType: string) => {
    switch (badgeType) {
      case "first_visit":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "regular":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "explorer":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "adventurer":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <section className="space-y-6">
        {profileLoading ? (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2 text-center sm:text-left">
              <Skeleton className="h-8 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-presence-primary">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-lg">
                {getInitials(profile?.username)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2 text-center sm:text-left">
              <h1 className="text-3xl font-bold">{profile?.username}</h1>
              <p className="text-gray-500">
                Explorer since {profile && format(new Date(profile.created_at), 'MMMM yyyy')}
              </p>
              {isOwnProfile && (
                <EditProfileDialog 
                  userId={userId} 
                  username={profile?.username}
                  avatarUrl={profile?.avatar_url}
                  onProfileUpdated={handleProfileUpdated}
                />
              )}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center">
              <div className="rounded-full bg-presence-soft-blue p-2 mb-2">
                <MapPin className="h-5 w-5 text-presence-primary" />
              </div>
              <div className="text-2xl font-bold">{profileLoading ? <Skeleton className="h-8 w-8" /> : profile?.total_check_ins || 0}</div>
              <p className="text-sm text-muted-foreground">Total Check-ins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center">
              <div className="rounded-full bg-presence-soft-pink p-2 mb-2">
                <Award className="h-5 w-5 text-presence-primary" />
              </div>
              <div className="text-2xl font-bold">{profileLoading ? <Skeleton className="h-8 w-8" /> : profile?.total_badges || 0}</div>
              <p className="text-sm text-muted-foreground">Badges Earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center">
              <div className="rounded-full bg-presence-primary bg-opacity-10 p-2 mb-2">
                <Star className="h-5 w-5 text-presence-primary" />
              </div>
              <div className="text-2xl font-bold">{profileLoading ? <Skeleton className="h-8 w-8" /> : profile?.unique_venues || 0}</div>
              <p className="text-sm text-muted-foreground">Unique Places</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tabs for Badges and Check-ins */}
      <Tabs defaultValue="badges">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="history">Check-in History</TabsTrigger>
        </TabsList>

        {/* Badges Tab */}
        <TabsContent value="badges" className="mt-6">
          <h2 className="text-xl font-bold mb-4">Earned Badges</h2>
          
          {badgesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : badges && badges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {badges.map((badge) => (
                <Card key={badge.id} className="overflow-hidden">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className={`rounded-full p-3 mb-3 ${getBadgeColor(badge.badge_type)}`}>
                      {badgeIcons[badge.badge_type] || <Award className="h-6 w-6" />}
                    </div>
                    <h3 className="font-medium">{badge.badge_type.replace('_', ' ')}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{badge.venue_name}</p>
                    <p className="text-xs mt-2">
                      {format(new Date(badge.earned_at), 'MMM d, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Award className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No badges yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Check in at new places to earn badges!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Check-ins Tab */}
        <TabsContent value="history" className="mt-6">
          <h2 className="text-xl font-bold mb-4">Check-in History</h2>
          
          {checkInsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : checkIns && checkIns.length > 0 ? (
            <div className="space-y-4">
              {checkIns.map((checkIn) => (
                <Card key={checkIn.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{checkIn.venue_name}</CardTitle>
                    <CardDescription className="flex items-center">
                      <Badge variant="outline" className="mr-2">
                        {checkIn.venue_type}
                      </Badge>
                      <span>
                        {format(new Date(checkIn.check_in_time), 'MMM d, yyyy • h:mm a')}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-muted-foreground mb-2">
                      <MapPin className="mr-1 h-4 w-4" />
                      <span>{checkIn.location}</span>
                    </div>
                    {checkIn.notes && <p className="text-sm mt-2">{checkIn.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No check-ins yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Start checking in at your favorite places.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
