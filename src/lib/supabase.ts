import { createClient } from "@supabase/supabase-js";
import type { Database } from '@/integrations/supabase/types';

// Get the Supabase URL and Anon Key from the environment
const supabaseUrl = "https://rtbicjimopzlqpodwjcm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0Ymljamltb3B6bHFwb2R3amNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMzU3OTQsImV4cCI6MjA2MjcxMTc5NH0.YIkf-O5N0nq1f41ybefYu6Eey7qOOhusdCamjLbJHJM";

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
});

// Define the types for venue types
export type VenueType = "Restaurant" | "Bar" | "Club" | "Event" | "Other";

// Function to get user profile
export const getProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting profile:", error);
    throw error;
  }
};

// Function to get user check-ins
export const getCheckIns = async (userId: string, limit = 5) => {
  try {
    const { data, error } = await supabase
      .from("check_ins")
      .select("*")
      .eq("user_id", userId)
      .order("check_in_time", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting check-ins:", error);
    throw error;
  }
};

// Function to get user badges
export const getUserBadges = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("badges")
      .select("*")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting badges:", error);
    throw error;
  }
};

// Function to get all recent check-ins with profile information
export const getAllCheckIns = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from("check_ins")
      .select(`
        *,
        profiles (
          username,
          avatar_url
        )
      `)
      .order("check_in_time", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting all check-ins:", error);
    throw error;
  }
};

// Function to get leaderboard
export const getLeaderboard = async () => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("total_check_ins", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    throw error;
  }
};

// Function to create a check-in - SIMPLIFIED with standard Supabase client
export const createCheckIn = async (checkInData: {
  user_id: string;
  venue_name: string;
  venue_type: VenueType;
  location: string;
  check_in_time: string;
  notes?: string;
}) => {
  try {
    console.log("=== CREATING CHECK-IN (SIMPLIFIED VERSION) ===");
    console.log("Full payload:", JSON.stringify(checkInData, null, 2));
    
    // Validate required fields
    if (!checkInData.user_id) throw new Error("Missing user_id");
    if (!checkInData.venue_name) throw new Error("Missing venue_name");
    if (!checkInData.venue_type) throw new Error("Missing venue_type");
    if (!checkInData.location) throw new Error("Missing location");
    if (!checkInData.check_in_time) throw new Error("Missing check_in_time");
    
    // Create a clean payload with only the needed fields
    const payload = {
      user_id: checkInData.user_id,
      venue_name: checkInData.venue_name,
      venue_type: checkInData.venue_type,
      location: checkInData.location,
      check_in_time: checkInData.check_in_time,
      notes: checkInData.notes || null,
    };
    
    console.log("Using clean payload:", JSON.stringify(payload, null, 2));
    
    // Simple and direct insert using the standard client
    const { data, error } = await supabase
      .from("check_ins")
      .insert([payload])
      .select();
    
    console.log("Check-in result:", { data, error });
    
    if (error) {
      console.error("Insert failed:", error);
      throw error;
    }
    
    console.log("Insert succeeded:", data);
    return data && data.length > 0 ? data[0] : null;
    
  } catch (error: any) {
    console.error("Final createCheckIn error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      stack: error.stack
    });
    throw error; // Re-throw to ensure error propagation
  }
};

// Function to check for nearby venues in database
export const getNearbyVenues = async (latitude: number, longitude: number, radius: number = 500) => {
  try {
    // Calculate a rough bounding box for faster querying
    const latDiff = radius / 111000; // approx 111km per degree of latitude
    const lonDiff = radius / (111000 * Math.cos(latitude * (Math.PI / 180)));
    
    const { data, error } = await supabase
      .from("venues")
      .select("*")
      .gte("latitude", latitude - latDiff)
      .lte("latitude", latitude + latDiff)
      .gte("longitude", longitude - lonDiff)
      .lte("longitude", longitude + lonDiff);
      
    if (error) {
      console.error("Error fetching saved venues:", error);
      return [];
    }
    
    if (!data || data.length === 0) return [];
    
    // Calculate actual distances and filter by radius
    return data
      .map(venue => {
        const distance = calculateDistance(
          latitude, 
          longitude, 
          Number(venue.latitude),
          Number(venue.longitude)
        );
        return { ...venue, distance };
      })
      .filter(venue => venue.distance <= radius);
  } catch (error) {
    console.error("Error getting nearby venues:", error);
    return [];
  }
};

// Helper function to calculate distance between coordinates in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in meters
};

// Function to save a venue - improved with better error handling and debugging
export const saveVenue = async (venueData: {
  place_id: string;
  name: string;
  address: string;
  types: string[];
  latitude: number;
  longitude: number;
}) => {
  if (!venueData.place_id) {
    console.error("Cannot save venue: missing place_id");
    return false;
  }

  try {
    console.log("Saving venue data:", venueData);
    
    // Double-check latitude and longitude are valid numbers
    if (isNaN(venueData.latitude) || isNaN(venueData.longitude)) {
      console.error("Invalid coordinates in venue data:", venueData);
      return false;
    }
    
    // Allow anonymous insert even without user
    const { error, status } = await supabase
      .from("venues")
      .upsert([venueData], { 
        onConflict: 'place_id', 
        ignoreDuplicates: true // Keep true to ignore duplicates
      });
      
    if (error) {
      console.error("Error saving venue:", error);
      console.error("Status code:", status);
      return false;
    }
    
    console.log("Venue saved successfully");
    return true;
  } catch (error) {
    console.error("Error in saveVenue function:", error);
    return false;
  }
};
