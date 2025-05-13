
import { useState, useEffect } from "react";

export type LocationData = {
  latitude: number;
  longitude: number;
  accuracy: number;
  loading: boolean;
  error: string | null;
};

export function useGeolocation() {
  const [location, setLocation] = useState<LocationData>({
    latitude: 0,
    longitude: 0,
    accuracy: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: "Geolocation is not supported by your browser"
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
        });
      },
      (error) => {
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: `Error getting location: ${error.message}`
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
