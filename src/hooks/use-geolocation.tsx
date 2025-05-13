
import { useState, useEffect } from "react";

export type LocationData = {
  latitude: number;
  longitude: number;
  accuracy: number;
  loading: boolean;
  error: string | null;
  permissionState: 'granted' | 'denied' | 'prompt' | 'unknown';
};

export function useGeolocation() {
  const [location, setLocation] = useState<LocationData>({
    latitude: 0,
    longitude: 0,
    accuracy: 0,
    loading: true,
    error: null,
    permissionState: 'unknown',
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: "Geolocation is not supported by your browser",
        permissionState: 'unknown'
      }));
      return;
    }

    // Check for permission state if available in the browser
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
        setLocation(prev => ({
          ...prev,
          permissionState: permissionStatus.state as 'granted' | 'denied' | 'prompt'
        }));

        // Listen for permission changes
        permissionStatus.addEventListener('change', () => {
          setLocation(prev => ({
            ...prev,
            permissionState: permissionStatus.state as 'granted' | 'denied' | 'prompt'
          }));
        });
      });
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
          permissionState: 'granted',
        });
      },
      (error) => {
        let errorMessage = `Error getting location: ${error.message}`;
        let permissionState: 'denied' | 'prompt' | 'unknown' = 'unknown';
        
        // Handle specific error codes
        if (error.code === 1) { // PERMISSION_DENIED
          errorMessage = "Location permission denied. Please enable location in your browser settings to use this feature.";
          permissionState = 'denied';
        } else if (error.code === 2) { // POSITION_UNAVAILABLE
          errorMessage = "Unable to determine your location. Please try again later.";
        } else if (error.code === 3) { // TIMEOUT
          errorMessage = "Location request timed out. Please check your connection and try again.";
        }
        
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
          permissionState: permissionState
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  return location;
}
