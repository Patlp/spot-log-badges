
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
      // Force a new location request with high accuracy and no caching
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve, 
          reject, 
          {
            enableHighAccuracy: true,
            timeout: 15000, // Longer timeout for slower connections
            maximumAge: 0    // Never use cached position
          }
        );
      });
      
      // Successfully got position
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        loading: false,
        error: null,
        permissionState: 'granted', // Force to granted if we got a position
        requestPermission: async () => await requestGeolocationPermission(),
      });
      
      // Double-check with permissions API if available (not on all browsers)
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          setLocation(prev => ({
            ...prev,
            permissionState: permissionStatus.state as 'granted' | 'denied' | 'prompt'
          }));
        } catch (e) {
          // If permissions query fails but we got a location, still consider it granted
          console.log("Permissions query failed but location was obtained");
        }
      }
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      let errorMessage = `Error getting location: ${geoError.message || 'Unknown error'}`;
      let permissionState: 'denied' | 'prompt' | 'unknown' = 'unknown';
      
      // Handle specific error codes
      if (geoError.code === 1) { // PERMISSION_DENIED
        errorMessage = "Location permission denied. Please enable location in your browser settings.";
        permissionState = 'denied';
      } else if (geoError.code === 2) { // POSITION_UNAVAILABLE
        errorMessage = "Unable to determine your location. Please try again later.";
      } else if (geoError.code === 3) { // TIMEOUT
        errorMessage = "Location request timed out. Please check your connection and try again.";
      }
      
      // For Safari-specific debugging
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari) {
        errorMessage += " (Safari browser detected - Please check Safari-specific settings)";
        console.log("Safari browser detected. Error:", errorMessage);
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

  // On component mount, check for geolocation support
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

    // Attempt an immediate location request on mobile Safari
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (/^((?!chrome|android).)*safari/i.test(navigator.userAgent))) {
      // For Safari/iOS we'll try to get location immediately  
      requestGeolocationPermission();
    }
    // For other browsers, check permission first
    else if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then(permissionStatus => {
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
          
          // If permission is already granted, get location immediately
          if (permissionStatus.state === 'granted') {
            requestGeolocationPermission();
          }
        })
        .catch(() => {
          // If permissions query fails, try getting location directly anyway
          requestGeolocationPermission();
        });
    } else {
      // If permissions API is not available, try getting location directly
      requestGeolocationPermission();
    }
  }, []);

  return location;
}
