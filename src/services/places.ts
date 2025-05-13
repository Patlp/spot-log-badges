
import { supabase } from '../lib/supabase';
import { toast } from '@/hooks/use-toast';

type GooglePlace = {
  place_id: string;
  name: string;
  types: string[];
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    }
  };
};

type PlaceDetails = {
  name: string;
  address: string;
  types: string[];
  place_id: string;
  latitude: number;
  longitude: number;
};

export async function getNearbyPlaces(
  latitude: number,
  longitude: number,
  radius: number = 500 // Increased radius for better results
): Promise<PlaceDetails[]> {
  try {
    // First check if we already have places saved in the database for these coordinates
    const { data: existingPlaces, error } = await supabase
      .from('venues')
      .select('*')
      .filter('latitude', 'gte', latitude - 0.005) // Increased range
      .filter('latitude', 'lte', latitude + 0.005)
      .filter('longitude', 'gte', longitude - 0.005)
      .filter('longitude', 'lte', longitude + 0.005);
    
    if (error) {
      console.error("Error fetching saved places:", error);
    } else if (existingPlaces && existingPlaces.length > 0) {
      console.log(`Found ${existingPlaces.length} existing places in our database`);
      return existingPlaces.map(place => ({
        name: place.name,
        address: place.address,
        types: place.types,
        place_id: place.place_id,
        latitude: place.latitude,
        longitude: place.longitude,
      }));
    }

    console.log(`No cached places found, fetching from API at ${latitude}, ${longitude}`);
    
    // Call our edge function to get places from Google Places API
    const apiUrl = `${window.location.origin.includes('localhost') ? 'https://rtbicjimopzlqpodwjcm.supabase.co' : ''}/functions/v1/get-nearby-places?lat=${latitude}&lng=${longitude}&radius=${radius}`;
    console.log(`Fetching places from: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`API error (${response.status}):`, errorData);
      throw new Error(`Error fetching places: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log("No places found from Google Places API");
      return [];
    }

    console.log(`Found ${data.results.length} places from Google Places API`);
    
    // Process the results
    return data.results.map((place: GooglePlace) => ({
      name: place.name,
      address: place.vicinity,
      types: place.types,
      place_id: place.place_id,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
    }));
  } catch (error) {
    console.error("Error in getNearbyPlaces:", error);
    // Show a toast with the error
    toast({ 
      title: "Error finding places", 
      description: error instanceof Error ? error.message : "Unknown error fetching places",
      variant: "destructive"
    });
    return [];
  }
}

export function mapGoogleTypeToVenueType(types: string[]): "Restaurant" | "Bar" | "Club" | "Event" | "Other" {
  if (types.some(type => 
    type === 'restaurant' || 
    type === 'food' || 
    type === 'cafe' || 
    type === 'meal_takeaway' || 
    type === 'meal_delivery'
  )) {
    return "Restaurant";
  }
  
  if (types.some(type => 
    type === 'bar' || 
    type === 'night_club' || 
    type === 'liquor_store'
  )) {
    return "Bar";
  }
  
  if (types.some(type => 
    type === 'night_club'
  )) {
    return "Club";
  }
  
  if (types.some(type => 
    type === 'event_venue' || 
    type === 'stadium' || 
    type === 'movie_theater' || 
    type === 'amusement_park' ||
    type === 'tourist_attraction'
  )) {
    return "Event";
  }
  
  return "Other";
}
