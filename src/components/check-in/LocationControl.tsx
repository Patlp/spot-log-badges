
import { Button } from "@/components/ui/button";
import { Loader2, LocateFixed, RefreshCw } from "lucide-react";
import { LocationDetector } from "@/components/LocationDetector";
import { toast } from "@/hooks/use-toast";

interface LocationControlProps {
  useLocation: boolean;
  isLoadingPlaces: boolean;
  onToggleLocation: () => void;
  onLocationFound: (latitude: number, longitude: number) => void;
  onLocationError: (error: string) => void;
  onLoadingChange: (isLoading: boolean) => void;
  onRetryFetch: () => void;
}

export function LocationControl({
  useLocation,
  isLoadingPlaces,
  onToggleLocation,
  onLocationFound,
  onLocationError,
  onLoadingChange,
  onRetryFetch
}: LocationControlProps) {
  return (
    <div className="mb-8">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={useLocation ? "default" : "outline"}
          className={`flex-1 ${isLoadingPlaces ? 'opacity-70' : ''}`}
          onClick={onToggleLocation}
          disabled={isLoadingPlaces}
        >
          {isLoadingPlaces ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finding places nearby...
            </>
          ) : useLocation ? (
            <>
              <LocateFixed className="mr-2 h-4 w-4" />
              Using your location
            </>
          ) : (
            <>
              <LocateFixed className="mr-2 h-4 w-4" />
              Find places near me
            </>
          )}
        </Button>

        {useLocation && !isLoadingPlaces && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              toast({
                title: "Refreshing places",
                description: "Searching for places near your current location.",
              });
              onRetryFetch();
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Location Detector Component */}
      {useLocation && (
        <div className="mt-2">
          <LocationDetector 
            onLocationFound={onLocationFound}
            onLocationError={onLocationError}
            onLoadingChange={onLoadingChange}
          />
        </div>
      )}
    </div>
  );
}
