
import { createClient } from "@supabase/supabase-js";

// Get the Supabase URL and Anon Key from the environment
const supabaseUrl = "https://rtbicjimopzlqpodwjcm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0Ymljamltb3B6bHFwb2R3amNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMzU3OTQsImV4cCI6MjA2MjcxMTc5NH0.YIkf-O5N0nq1f41ybefYu6Eey7qOOhusdCamjLbJHJM";

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define the types for venue types
export type VenueType = "Restaurant" | "Bar" | "Club" | "Event" | "Other";

// Function to get user profile
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
};

// Function to get user check-ins
export const getCheckIns = async (userId: string, limit = 5) => {
  const { data, error } = await supabase
    .from("check_ins")
    .select("*")
    .eq("user_id", userId)
    .order("check_in_time", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

// Function to get user badges
export const getUserBadges = async (userId: string) => {
  const { data, error } = await supabase
    .from("badges")
    .select("*")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Function to get all recent check-ins with profile information
export const getAllCheckIns = async (limit = 10) => {
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
};

// Function to get leaderboard
export const getLeaderboard = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("total_check_ins", { ascending: false });

  if (error) throw error;
  return data;
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
  const { data, error } = await supabase
    .from("check_ins")
    .insert([checkInData])
    .select()
    .single();

  if (error) throw error;
  return data;
};
