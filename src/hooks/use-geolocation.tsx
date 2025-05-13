
import { useState, useEffect } from "react";

export type LocationData = {
  latitude: number;
  longitude: number;
  accuracy: number;
  loading: boolean;
  error: string | null;
  permissionState: 'granted' | 'denied' | 'prompt' | 'unknown';
  requestPermission: () => Promise<void>;
};

export function useGeolocation() {
  const [location, setLocation] = useState<LocationData>({
    latitude: 0,
    longitude: 0,
    accuracy: 0,
    loading: true,
    error: null,
    permissionState: 'unknown',
    requestPermission: async () => await requestGeolocationPermission(),
  });

  // Function to actively request location permission
  const requestGeolocationPermission = async () => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        loading: false,
        error: null,
        permissionState: 'granted',
        requestPermission: async () => await requestGeolocationPermission(),
      });
      
      // Update permission state
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        setLocation(prev => ({
          ...prev,
          permissionState: permissionStatus.state as 'granted' | 'denied' | 'prompt'
        }));
      }
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      let errorMessage = `Error getting location: ${geoError.message}`;
      let permissionState: 'denied' | 'prompt' | 'unknown' = 'unknown';
      
      // Handle specific error codes
      if (geoError.code === 1) { // PERMISSION_DENIED
        errorMessage = "Location permission denied. Please enable location in your browser settings to use this feature.";
        permissionState = 'denied';
      } else if (geoError.code === 2) { // POSITION_UNAVAILABLE
        errorMessage = "Unable to determine your location. Please try again later.";
      } else if (geoError.code === 3) { // TIMEOUT
        errorMessage = "Location request timed out. Please check your connection and try again.";
      }
      
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        permissionState: permissionState,
        requestPermission: async () => await requestGeolocationPermission(),
      }));
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: "Geolocation is not supported by your browser",
        permissionState: 'unknown',
        requestPermission: async () => await requestGeolocationPermission(),
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
        
        // If permission is granted, get location immediately
        if (permissionStatus.state === 'granted') {
          requestGeolocationPermission();
        }
      });
    } else {
      // If permissions API is not available, try getting location directly
      requestGeolocationPermission();
    }
  }, []);

  return location;
}
