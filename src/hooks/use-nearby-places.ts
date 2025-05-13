
import { useState } from "react";
import { getNearbyPlaces, Place } from "@/services/places";
import { useToast } from "@/hooks/use-toast";

export const useNearbyPlaces = () => {
  const { toast } = useToast();
  const [useLocation, setUseLocation] = useState(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Handle when location is found
  const handleLocationFound = async (latitude: number, longitude: number) => {
    console.log("Location found in useNearbyPlaces:", latitude, longitude);
    setLocationCoords({lat: latitude, lng: longitude});
    setLocationError(null);
    
    if (useLocation) {
      fetchNearbyPlaces(latitude, longitude);
    }
  };

  // Handle location errors
  const handleLocationError = (error: string) => {
    setLocationError(error);
    console.error("Location error:", error);
  };

  // Handle location loading state changes
  const handleLoadingChange = (isLoading: boolean) => {
    setIsLoadingPlaces(isLoading);
  };

  // Fetch nearby places function
  const fetchNearbyPlaces = async (latitude: number, longitude: number) => {
    if (!latitude || !longitude) return;
    
    setIsLoadingPlaces(true);
    try {
      console.log("Fetching places at coordinates:", latitude, longitude);
      const places = await getNearbyPlaces(latitude, longitude);
      console.log("Fetched places:", places);
      setNearbyPlaces(places);
      
      // If no places found, show an error toast
      if (places.length === 0) {
        toast({
          title: "No places found nearby",
          description: "Try expanding your search area or manually enter venue details.",
          variant: "destructive",
        });
      }
      // We removed the success toast notification here
    } catch (error) {
      console.error("Error fetching places:", error);
      toast({
        title: "Error fetching nearby places",
        description: "There was a problem finding venues near you. Please try again or enter venue details manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  // Toggle location usage and fetch places
  const handleToggleLocation = () => {
    const newState = !useLocation;
    setUseLocation(newState);
    
    // If turning location on and we already have coordinates, fetch places
    if (newState && locationCoords) {
      fetchNearbyPlaces(locationCoords.lat, locationCoords.lng);
    }
  };

  return {
    useLocation,
    isLoadingPlaces,
    nearbyPlaces,
    locationCoords,
    locationError,
    handleLocationFound,
    handleLocationError,
    handleLoadingChange,
    handleToggleLocation,
    fetchNearbyPlaces
  };
};
