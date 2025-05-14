
import { MapPin, Award, Trophy } from "lucide-react";

const LeaderboardHowTo = () => {
  return (
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
  );
};

export default LeaderboardHowTo;
