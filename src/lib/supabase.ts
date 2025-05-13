
import { createClient } from "@supabase/supabase-js";

// Get the Supabase URL and Anon Key from the environment
const supabaseUrl = "https://rtbicjimopzlqpodwjcm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0Ymljamltb3B6bHFwb2R3amNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMzU3OTQsImV4cCI6MjA2MjcxMTc5NH0.YIkf-O5N0nq1f41ybefYu6Eey7qOOhusdCamjLbJHJM";

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    // Added for debugging
    fetch: (...args) => {
      console.log("Supabase fetch:", args[0]);
      return fetch(...args);
    },
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

// Function to create a check-in
export const createCheckIn = async (checkInData: {
  user_id: string;
  venue_name: string;
  venue_type: VenueType;
  location: string;
  check_in_time: string;
  notes?: string;
}) => {
  try {
    console.log("Creating check-in with data:", checkInData);
    const { data, error } = await supabase
      .from("check_ins")
      .insert([checkInData])
      .select()
      .single();

    if (error) {
      console.error("Error creating check-in:", error);
      throw error;
    }
    console.log("Check-in created successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in createCheckIn function:", error);
    throw error;
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

// Function to save a venue
export const saveVenue = async (venueData: {
  place_id: string;
  name: string;
  address: string;
  types: string[];
  latitude: number;
  longitude: number;
}) => {
  try {
    console.log("Saving venue data:", venueData);
    
    // Allow anonymous insert even without user
    const { error } = await supabase
      .from("venues")
      .upsert([venueData], { 
        onConflict: 'place_id', 
        ignoreDuplicates: true // Changed to true to ignore duplicates
      });
      
    if (error) {
      console.error("Error saving venue:", error);
      // Don't throw error, just log it
    } else {
      console.log("Venue saved successfully");
    }
    return true;
  } catch (error) {
    console.error("Error in saveVenue function:", error);
    // Don't throw error, just return false
    return false;
  }
};
