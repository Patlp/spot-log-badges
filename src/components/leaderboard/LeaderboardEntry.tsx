
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Award } from "lucide-react";

type LeaderboardEntryProps = {
  profile: {
    id: string;
    username: string;
    avatar_url: string | null;
    total_check_ins: number;
    total_badges: number;
    unique_venues: number;
  };
  position: number;
  isCurrentUser: boolean;
};

export const getInitials = (username?: string) => {
  if (!username) return "U";
  return username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export const getMedalColor = (position: number) => {
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

export const getRankBg = (position: number) => {
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

const LeaderboardEntry = ({ profile, position, isCurrentUser }: LeaderboardEntryProps) => {
  return (
    <Link
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
              <span className="ml-2 text-xs inline-flex items-center font-medium bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs">
                You
              </span>
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
};

export default LeaderboardEntry;
