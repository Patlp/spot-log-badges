import { createClient } from "@supabase/supabase-js";
import rawSupabase from "./rawSupabaseClient";

// Get the Supabase URL and Anon Key from the environment
const supabaseUrl = "https://rtbicjimopzlqpodwjcm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0Ymljamltb3B6bHFwb2R3amNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMzU3OTQsImV4cCI6MjA2MjcxMTc5NH0.YIkf-O5N0nq1f41ybefYu6Eey7qOOhusdCamjLbJHJM";

// Create a supabase client with no type bindings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
});

// Create storage bucket for avatars if it doesn't exist
const initStorage = async () => {
  try {
    // Check if avatars bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const avatarBucketExists = buckets?.some(bucket => bucket.name === 'avatars');

    if (!avatarBucketExists) {
      // Create avatars bucket
      await supabase.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif']
      });
      console.log('Created avatars storage bucket');
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

// Initialize storage on load
initStorage();

// Define the venue type as a string literal union type for proper type checking
export type VenueType = "Restaurant" | "Bar" | "Club" | "Event" | "Other";

// Function to get user profile
export const getProfile = async (userId: string) => {
  try {
    // Get the basic profile data
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) throw profileError;
    
    // Get the total number of check-ins for this user
    const { count: totalCheckIns, error: checkInsError } = await supabase
      .from("check_ins")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", userId);
      
    if (checkInsError) throw checkInsError;
    
    // Get the number of unique venues the user has checked into
    const { data: uniqueVenues, error: uniqueVenuesError } = await supabase
      .from("check_ins")
      .select("venue_name")
      .eq("user_id", userId)
      .limit(1000); // Reasonable limit to prevent performance issues
      
    if (uniqueVenuesError) throw uniqueVenuesError;
    
    // Count unique venue names using a Set
    const uniqueVenueSet = new Set(uniqueVenues.map(checkIn => checkIn.venue_name));
    const uniqueVenueCount = uniqueVenueSet.size;
    
    // Count badges (for now we'll keep this as is, but enhance the data)
    const { count: badgesCount, error: badgesError } = await supabase
      .from("badges")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", userId);
      
    if (badgesError) throw badgesError;
    
    // Return the enhanced profile with real-time counts
    return {
      ...profileData,
      total_check_ins: totalCheckIns || 0,
      unique_venues: uniqueVenueCount || 0,
      total_badges: badgesCount || 0
    };
  } catch (error) {
    console.error("Error getting profile:", error);
    throw error;
  }
};

// Function to update user profile
export const updateProfile = async (userId: string, updates: { username?: string; avatar_url?: string }) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

// Function to upload avatar
export const uploadAvatar = async (userId: string, file: File) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    
    // Upload file
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    // Get public URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading avatar:", error);
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

// Function to get accurate leaderboard data
export const getAccurateLeaderboard = async () => {
  try {
    console.log("Fetching leaderboard data - timestamp:", Date.now());
    
    // Skip the RPC call since it's failing and go straight to manual profile updating
    console.log("Using manual profile stats refresh...");
    
    // Get all profiles first
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id");
      
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    } else if (profiles) {
      console.log(`Found ${profiles.length} profiles to update manually`);
      
      // Update each profile individually
      for (const profile of profiles) {
        try {
          // Update check-in counts
          const { count: checkInsCount } = await supabase
            .from("check_ins")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", profile.id);
            
          // Update unique venues count
          const { data: venues } = await supabase
            .from("check_ins")
            .select("venue_name")
            .eq("user_id", profile.id);
          
          const uniqueVenuesCount = venues ? new Set(venues.map(v => v.venue_name)).size : 0;
          
          // Update badge count
          const { count: badgesCount } = await supabase
            .from("badges")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", profile.id);
            
          // Update the profile with the new counts
          await supabase
            .from("profiles")
            .update({
              total_check_ins: checkInsCount || 0,
              unique_venues: uniqueVenuesCount,
              total_badges: badgesCount || 0
            })
            .eq("id", profile.id);
            
          console.log(`Updated profile ${profile.id} with: ${checkInsCount} check-ins, ${uniqueVenuesCount} unique venues, ${badgesCount} badges`);
        } catch (profileUpdateError) {
          console.error(`Failed to update profile ${profile.id}:`, profileUpdateError);
        }
      }
    }
    
    // Then fetch the profiles with fresh data
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("unique_venues", { ascending: false });

    if (error) {
      console.error("Error fetching leaderboard:", error);
      throw error;
    }
    
    console.log("Leaderboard data fetched:", data?.length, "profiles");
    return data;
  } catch (error) {
    console.error("Error getting accurate leaderboard data:", error);
    throw error;
  }
};

// Function to create a check-in - Using raw client to bypass type issues
export const createCheckIn = async (checkInData: {
  user_id: string;
  venue_name: string;
  venue_type: string;  // Changed from VenueType to string and validated inside
  location: string;
  check_in_time: string;
  notes?: string;
}) => {
  try {
    console.log("=== CREATING CHECK-IN (SIMPLIFIED) ===");
    console.log("Check-in started");
    
    // Validate required fields
    if (!checkInData.user_id) throw new Error("Missing user_id");
    if (!checkInData.venue_name) throw new Error("Missing venue_name");
    if (!checkInData.venue_type) throw new Error("Missing venue_type");
    if (!checkInData.location) throw new Error("Missing location");
    if (!checkInData.check_in_time) throw new Error("Missing check_in_time");
    
    // Validate venue_type is one of the allowed values
    const venueTypeValues: string[] = ["Restaurant", "Bar", "Club", "Event", "Other"];
    if (!venueTypeValues.includes(checkInData.venue_type)) {
      throw new Error(`Invalid venue_type. Must be one of: ${venueTypeValues.join(', ')}`);
    }
    
    // Create a clean payload with only the needed fields
    const testData = {
      user_id: checkInData.user_id,
      venue_name: checkInData.venue_name,
      venue_type: checkInData.venue_type,
      location: checkInData.location,
      check_in_time: checkInData.check_in_time,
      notes: checkInData.notes || null,
    };
    
    console.log("Check-in data prepared:", testData);
    
    // Using direct insert with explicit try/catch as requested
    try {
      console.log("Check-in started", { testData });
      const { data, error } = await supabase
        .from("check_ins")
        .insert([testData])
        .select();
      
      console.log("Insert result:", { data, error });
      
      if (error) {
        console.error("Insert failed with error:", error);
        throw new Error(error.message || "Failed to create check-in");
      }
      
      if (!data || data.length === 0) {
        console.error("No data returned after successful insert");
        throw new Error("No data returned from insert operation");
      }
      
      console.log("Check-in finished successfully:", data);
      
      // Also update the user's check-in count in the profile
      try {
        const { error: updateError } = await supabase.rpc('increment_check_in_count', {
          user_id_param: checkInData.user_id,
          venue_name_param: checkInData.venue_name
        });
        
        if (updateError) {
          console.warn("Failed to update profile check-in count:", updateError);
          // Don't throw here, just log the warning
        }
      } catch (updateError) {
        console.warn("Error updating profile after check-in:", updateError);
        // Don't throw here, the check-in was successful
      }
      
      return data[0];
    } catch (insertError: any) {
      console.error("Check-in insert error:", insertError);
      alert("Check-in failed: " + (insertError.message || "Unknown error"));
      throw insertError;
    }
    
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

// Function to award "first_visit" badge
export const awardFirstVisitBadge = async (userId: string, venueName: string) => {
  try {
    console.log("Checking for first visit badge eligibility:", { userId, venueName });
    
    // Check if this is truly the first check-in at this venue for this user
    const { count: visitCount, error: visitCountError } = await supabase
      .from("check_ins")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", userId)
      .eq("venue_name", venueName);
      
    if (visitCountError) {
      console.error("Error checking visit count:", visitCountError);
      return false;
    }

    // If this is not the first visit (count > 1), don't award badge
    if (visitCount !== 1) {
      console.log("Not first visit to this venue, badge not awarded", { visitCount });
      return false;
    }
    
    // Check if badge already exists for this venue and user to avoid duplicates
    const { count: badgeExists, error: badgeCheckError } = await supabase
      .from("badges")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", userId)
      .eq("venue_name", venueName)
      .eq("badge_type", "first_visit");
      
    if (badgeCheckError) {
      console.error("Error checking existing badge:", badgeCheckError);
      return false;
    }
    
    // If badge already exists, don't create a duplicate
    if (badgeExists > 0) {
      console.log("Badge already exists, not creating duplicate");
      return false;
    }
    
    // Create the badge
    const badgeData = {
      user_id: userId,
      venue_name: venueName,
      badge_type: "first_visit",
      earned_at: new Date().toISOString(),
      icon: "map-pin"
    };
    
    console.log("Creating first visit badge:", badgeData);
    
    const { error: insertError } = await supabase
      .from("badges")
      .insert([badgeData]);
      
    if (insertError) {
      console.error("Error creating badge:", insertError);
      return false;
    }
    
    console.log("First visit badge awarded successfully!");
    return true;
  } catch (error) {
    console.error("Error awarding first visit badge:", error);
    return false;
  }
};
