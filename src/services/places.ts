
import { supabase, getNearbyVenues, saveVenue } from "@/lib/supabase";

export interface Place {
  place_id: string;
  name: string;
  address: string;
  types: string[];
  latitude: number;
  longitude: number;
  distance?: number;
}

// Function to map Google place types to venue categories
export const mapGoogleTypeToVenueType = (types: string[]): string => {
  if (types.includes('restaurant') || types.includes('food') || types.includes('meal_takeaway') || types.includes('cafe')) {
    return 'Restaurant';
  } else if (types.includes('bar')) {
    return 'Bar';
  } else if (types.includes('night_club')) {
    return 'Club';
  } else if (types.includes('event_venue') || types.includes('stadium') || types.includes('concert_hall')) {
    return 'Event';
  } else {
    return 'Other';
  }
};

// Function to get nearby places using either cached data or the API
export const getNearbyPlaces = async (
  latitude: number,
  longitude: number,
  radius: number = 500
): Promise<Place[]> => {
  try {
    // First try to get places from our database
    const cachedPlaces = await getNearbyVenues(latitude, longitude, radius);
    
    if (cachedPlaces && cachedPlaces.length > 0) {
      console.info(`Found ${cachedPlaces.length} cached places in the database`);
      return cachedPlaces as Place[];
    }
    
    console.info(`No cached places found, fetching from API at ${latitude}, ${longitude}`);
    
    // If no cached places, fetch from the API
    const endpoint = `https://rtbicjimopzlqpodwjcm.supabase.co/functions/v1/get-nearby-places?lat=${latitude}&lng=${longitude}&radius=${radius}`;
    console.info(`Fetching places from: ${endpoint}`);
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const places = await response.json();
    console.info(`Fetched places: ${places.length}`);
    
    // Cache the places in our database for future use
    if (places && places.length > 0) {
      try {
        // We'll save the places asynchronously without blocking
        places.forEach(async (place: Place) => {
          await saveVenue({
            place_id: place.place_id,
            name: place.name,
            address: place.address,
            types: place.types,
            latitude: place.latitude,
            longitude: place.longitude
          });
        });
      } catch (error) {
        console.error("Error caching places:", error);
      }
    }
    
    return places;
  } catch (error) {
    console.error("Error fetching nearby places:", error);
    return [];
  }
};
