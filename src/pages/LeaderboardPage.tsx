
import { useContext } from "react";
import { AuthContext } from "../App";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, RefreshCw, AlertCircle } from "lucide-react";
import LeaderboardList from "@/components/leaderboard/LeaderboardList";
import LeaderboardHowTo from "@/components/leaderboard/LeaderboardHowTo";
import { useLeaderboardRefresh } from "@/hooks/useLeaderboardRefresh";
import { Alert, AlertDescription } from "@/components/ui/alert";

const LeaderboardPage = () => {
  const { user } = useContext(AuthContext);
  const { leaderboard, isLoading, isError, refetchLeaderboard } = useLeaderboardRefresh();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground mt-2">
          Who's been exploring the most? Check out our top adventurers.
        </p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Rankings</h2>
        <Button 
          onClick={refetchLeaderboard} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            There was a problem loading the leaderboard. Please refresh or try again later.
          </AlertDescription>
        </Alert>
      )}

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
