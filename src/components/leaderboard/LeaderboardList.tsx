
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";
import LeaderboardEntry from "./LeaderboardEntry";

type LeaderboardProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  total_check_ins: number;
  total_badges: number;
  unique_venues: number;
};

type LeaderboardListProps = {
  leaderboard: LeaderboardProfile[] | null;
  isLoading: boolean;
  currentUserId?: string;
};

const LeaderboardList = ({ leaderboard, isLoading, currentUserId }: LeaderboardListProps) => {
  if (isLoading) {
    return (
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
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="mx-auto h-12 w-12 text-muted-foreground opacity-40" />
        <h3 className="mt-4 text-lg font-medium">No explorers yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Be the first to check in and top the leaderboard!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leaderboard.map((profile, index) => (
        <LeaderboardEntry
          key={profile.id}
          profile={profile}
          position={index + 1}
          isCurrentUser={profile.id === currentUserId}
        />
      ))}
    </div>
  );
};

export default LeaderboardList;
