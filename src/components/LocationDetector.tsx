
import { useEffect, useState } from "react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, LocateFixed, Loader2, MapPin } from "lucide-react";

interface LocationDetectorProps {
  onLocationFound: (latitude: number, longitude: number) => void;
  onLocationError: (error: string) => void;
  onLoadingChange: (isLoading: boolean) => void;
}

export function LocationDetector({ 
  onLocationFound, 
  onLocationError,
  onLoadingChange
}: LocationDetectorProps) {
  const geolocation = useGeolocation();
  const [retryCount, setRetryCount] = useState(0);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  // Try again button handler
  const handleRetryLocation = async () => {
    setRetryCount(prev => prev + 1);
    onLoadingChange(true);
    await geolocation.requestPermission();
  };

  // When geolocation changes
  useEffect(() => {
    // If we have coordinates, call the onLocationFound callback
    if (!geolocation.loading && geolocation.latitude !== 0 && geolocation.longitude !== 0) {
      console.log("Location found:", geolocation.latitude, geolocation.longitude);
      onLocationFound(geolocation.latitude, geolocation.longitude);
      onLoadingChange(false);
      
      // Show successful toast on first successful location detection
      if (retryCount > 0) {
        toast({
          title: "Location detected!",
          description: "Successfully found your location.",
        });
      }
    } 
    // If there's an error, call the onLocationError callback
    else if (!geolocation.loading && geolocation.error) {
      console.log("Location error:", geolocation.error);
      onLocationError(geolocation.error);
      onLoadingChange(false);
      setShowPermissionPrompt(true);
    } 
    // Update loading state
    else {
      onLoadingChange(geolocation.loading);
    }
  }, [geolocation, onLocationFound, onLocationError, onLoadingChange, retryCount]);

  // Return UI for permission prompts
  return (
    <>
      {geolocation.loading && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Getting your location...</span>
        </div>
      )}
      
      {showPermissionPrompt && geolocation.error && (
        <Alert className="mt-2 animate-in fade-in-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Location Access Required</AlertTitle>
          <AlertDescription className="text-xs">
            {navigator.userAgent.includes("Safari") || navigator.userAgent.includes("iPad") ? (
              <>
                <p>For iPad/Safari users:</p>
                <ol className="list-decimal ml-5 mt-1 space-y-1">
                  <li>Check that your iPad location services are on in Settings {'>'} Privacy {'>'} Location Services</li>
                  <li>In Safari, tap "AA" in the address bar</li>
                  <li>Select "Website Settings"</li>
                  <li>Verify "Location" is set to "Allow"</li>
                  <li>Close settings and tap "Try Again" below</li>
                </ol>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRetryLocation}
                  >
                    <LocateFixed className="mr-2 h-3 w-3" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Switching to manual mode",
                        description: "You can still check in by entering venue information manually.",
                      });
                      setShowPermissionPrompt(false);
                    }}
                  >
                    <MapPin className="mr-2 h-3 w-3" />
                    Use Manual Mode
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p>Please enable location services in your browser settings and try again.</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                  onClick={handleRetryLocation}
                >
                  <LocateFixed className="mr-2 h-3 w-3" />
                  Try Again
                </Button>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {!geolocation.loading && !geolocation.error && geolocation.latitude !== 0 && (
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>Location found at {geolocation.latitude.toFixed(5)}, {geolocation.longitude.toFixed(5)}</span>
        </div>
      )}
    </>
  );
}
