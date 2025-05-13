
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get query parameters
  const url = new URL(req.url);
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  const radius = url.searchParams.get("radius") || "500";

  console.log(`Received request for places at coordinates: ${lat},${lng} with radius: ${radius}m`);

  // Validate parameters
  if (!lat || !lng) {
    return new Response(
      JSON.stringify({ error: "Latitude and longitude are required" }),
      { status: 400, headers: corsHeaders }
    );
  }

  if (!GOOGLE_PLACES_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Google Places API key not configured" }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    // Call Google Places API
    const googlePlacesUrl = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
    googlePlacesUrl.searchParams.append("location", `${lat},${lng}`);
    googlePlacesUrl.searchParams.append("radius", radius);
    googlePlacesUrl.searchParams.append("type", "establishment");
    googlePlacesUrl.searchParams.append("key", GOOGLE_PLACES_API_KEY);

    console.log(`Fetching places near ${lat},${lng} within ${radius}m radius`);
    const response = await fetch(googlePlacesUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Google Places API responded with status: ${response.status}`);
    }
    
    // Parse response as text first to check for malformed JSON
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Google Places API response:", parseError);
      throw new Error("Invalid response from Google Places API");
    }
    
    console.log(`Found ${data.results?.length || 0} places`);

    // Return the results with proper headers
    return new Response(
      JSON.stringify(data),
      { 
        headers: corsHeaders,
        status: 200
      }
    );
  } catch (error) {
    console.error("Error in get-nearby-places function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
