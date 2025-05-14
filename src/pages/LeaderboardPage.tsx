
import { useContext } from "react";
import { AuthContext } from "../App";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import LeaderboardList from "@/components/leaderboard/LeaderboardList";
import LeaderboardHowTo from "@/components/leaderboard/LeaderboardHowTo";
import { useLeaderboardRefresh } from "@/hooks/useLeaderboardRefresh";

const LeaderboardPage = () => {
  const { user } = useContext(AuthContext);
  const { leaderboard, isLoading } = useLeaderboardRefresh();

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
            Ranked by unique places visited
          </CardDescription>
        </CardHeader>

        <CardContent>
          <LeaderboardList 
            leaderboard={leaderboard} 
            isLoading={isLoading} 
            currentUserId={user?.id} 
          />
        </CardContent>
      </Card>

      <LeaderboardHowTo />
    </div>
  );
};

export default LeaderboardPage;
