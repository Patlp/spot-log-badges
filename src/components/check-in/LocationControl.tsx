
import { Button } from "@/components/ui/button";
import { Loader2, LocateFixed } from "lucide-react";
import { LocationDetector } from "@/components/LocationDetector";

interface LocationControlProps {
  useLocation: boolean;
  isLoadingPlaces: boolean;
  onToggleLocation: () => void;
  onLocationFound: (latitude: number, longitude: number) => void;
  onLocationError: (error: string) => void;
  onLoadingChange: (isLoading: boolean) => void;
}

export function LocationControl({
  useLocation,
  isLoadingPlaces,
  onToggleLocation,
  onLocationFound,
  onLocationError,
  onLoadingChange
}: LocationControlProps) {
  return (
    <div className="mb-8">
      <Button
        type="button"
        variant={useLocation ? "default" : "outline"}
        className="w-full"
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
            Using your location • Tap to refresh
          </>
        ) : (
          <>
            <LocateFixed className="mr-2 h-4 w-4" />
            Find places near me
          </>
        )}
      </Button>

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
