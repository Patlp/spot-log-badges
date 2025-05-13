
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

// Function to create a check-in and process any badges or profile updates
export const createCheckIn = async (checkInData: {
  user_id: string;
  venue_name: string;
  venue_type: VenueType;
  location: string;
  check_in_time: string;
  notes?: string;
}) => {
  try {
    console.log("Check-in started", { testData: checkInData });
    
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
    
    console.log("Using payload:", JSON.stringify(payload, null, 2));
    
    // Simple and direct insert using EXACTLY the requested structure
    const { data, error } = await supabase
      .from("check_ins")
      .insert([payload])
      .select();
    
    console.log("Insert result:", { data, error });
    
    if (error) {
      console.error("Insert failed with error:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.error("No data returned after successful insert");
      throw new Error("No data returned from insert operation");
    }
    
    // ---------- BADGE PROCESSING ----------
    // After successful check-in, process badges
    const checkIn = data[0];
    console.log("Processing badges for check-in:", checkIn);
    
    try {
      // Check if this is the user's first check-in at this venue
      const { data: prevCheckIns, error: checkInError } = await supabase
        .from("check_ins")
        .select("id")
        .eq("user_id", checkInData.user_id)
        .eq("venue_name", checkInData.venue_name)
        .neq("id", checkIn.id) // Exclude the current check-in
        .limit(1);
        
      if (checkInError) {
        console.error("Error checking previous check-ins:", checkInError);
        // Continue processing even if this check fails
      } else {
        // If this is the first check-in at this venue, award a "first_visit" badge
        if (!prevCheckIns || prevCheckIns.length === 0) {
          console.log(`First visit to ${checkInData.venue_name}, awarding badge`);
          const badgeData = {
            user_id: checkInData.user_id,
            venue_name: checkInData.venue_name,
            badge_type: "first_visit",
            icon: "map-pin",
            earned_at: new Date().toISOString()
          };
          
          const { data: badgeResult, error: badgeError } = await supabase
            .from("badges")
            .insert([badgeData])
            .select();
            
          if (badgeError) {
            console.error("Error awarding badge:", badgeError);
          } else {
            console.log("Badge awarded:", badgeResult);
          }
        } else {
          // Check if this is their 3rd+ check-in at this venue, award a "regular" badge
          const { data: checkInCount, error: countError } = await supabase
            .from("check_ins")
            .select("id")
            .eq("user_id", checkInData.user_id)
            .eq("venue_name", checkInData.venue_name);
            
          if (!countError && checkInCount && checkInCount.length >= 3) {
            // Check if they already have a regular badge for this venue
            const { data: existingBadges, error: badgeQueryError } = await supabase
              .from("badges")
              .select("id")
              .eq("user_id", checkInData.user_id)
              .eq("venue_name", checkInData.venue_name)
              .eq("badge_type", "regular")
              .limit(1);
              
            if (!badgeQueryError && (!existingBadges || existingBadges.length === 0)) {
              console.log(`Regular at ${checkInData.venue_name}, awarding badge`);
              const badgeData = {
                user_id: checkInData.user_id,
                venue_name: checkInData.venue_name,
                badge_type: "regular",
                icon: "star",
                earned_at: new Date().toISOString()
              };
              
              const { data: badgeResult, error: badgeError } = await supabase
                .from("badges")
                .insert([badgeData])
                .select();
                
              if (badgeError) {
                console.error("Error awarding regular badge:", badgeError);
              } else {
                console.log("Regular badge awarded:", badgeResult);
              }
            }
          }
        }
      }
      
      // ---------- UPDATE USER PROFILE ----------
      // Get the user's unique venues
      const { data: uniqueVenues, error: uniqueError } = await supabase
        .from("check_ins")
        .select("venue_name")
        .eq("user_id", checkInData.user_id)
        .is("venue_name", 'not.null');
      
      if (uniqueError) {
        console.error("Error getting unique venues:", uniqueError);
      } else {
        // Count unique venue names
        const uniqueVenueNames = new Set();
        uniqueVenues?.forEach(v => uniqueVenueNames.add(v.venue_name));
        const uniqueVenueCount = uniqueVenueNames.size;
        
        // Get badge count
        const { data: badgeCount, error: badgeCountError } = await supabase
          .from("badges")
          .select("id")
          .eq("user_id", checkInData.user_id);
          
        if (badgeCountError) {
          console.error("Error getting badge count:", badgeCountError);
        } else {
          // Update profile stats
          const { error: profileUpdateError } = await supabase
            .from("profiles")
            .update({
              total_check_ins: uniqueVenues ? uniqueVenues.length : 0,
              unique_venues: uniqueVenueCount,
              total_badges: badgeCount ? badgeCount.length : 0
            })
            .eq("id", checkInData.user_id);
            
          if (profileUpdateError) {
            console.error("Error updating profile stats:", profileUpdateError);
          } else {
            console.log("Profile stats updated successfully");
          }
        }
      }
    } catch (processingError) {
      console.error("Error in badge/profile processing:", processingError);
      // We don't want to fail the check-in if badge processing fails
      // Just log the error and continue
    }
    
    console.log("Check-in completed successfully:", data[0]);
    return data[0];
    
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
