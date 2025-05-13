
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
    try {
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
    } catch (dbError) {
      // If database query fails, log and continue to API query
      console.error("Database query error:", dbError);
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

    // Use text() and then JSON.parse to avoid SyntaxError with malformed JSON
    const responseText = await response.text();
    console.log("Raw API response:", responseText.substring(0, 100) + "..."); // Log a snippet of response
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Response:", responseText);
      throw new Error("Invalid response format from places API");
    }
    
    if (!data.results || data.results.length === 0) {
      console.log("No places found from Google Places API");
      return [];
    }

    console.log(`Found ${data.results.length} places from Google Places API`);
    
    // Process the results, sort by proximity to user
    const places = data.results.map((place: GooglePlace) => ({
      name: place.name,
      address: place.vicinity,
      types: place.types,
      place_id: place.place_id,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
    }));
    
    // Calculate distance to sort by proximity
    const placesWithDistance = places.map(place => {
      const distance = calculateDistance(
        latitude, 
        longitude, 
        place.latitude, 
        place.longitude
      );
      return { ...place, distance };
    });
    
    // Sort by distance (closest first)
    return placesWithDistance.sort((a, b) => a.distance - b.distance);
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

// Haversine formula to calculate distance between two coordinates in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
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
