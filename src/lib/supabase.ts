
import { createClient } from '@supabase/supabase-js';

// These environment variables are set by Lovable when you integrate with Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Make sure you have integrated Supabase with your Lovable project and refreshed the page.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Type definitions for our database schema
export type VenueType = 'Bar' | 'Restaurant' | 'Club' | 'Event' | 'Other';

export interface CheckIn {
  id: number;
  user_id: string;
  venue_name: string;
  venue_type: VenueType;
  location: string;
  check_in_time: string;
  notes?: string;
  created_at: string;
}

export interface Badge {
  id: number;
  user_id: string;
  venue_name: string;
  badge_type: string;
  earned_at: string;
  icon: string;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  total_check_ins: number;
  total_badges: number;
  unique_venues: number;
}

// Helper functions for data access
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as Profile;
};

export const getCheckIns = async (userId: string, limit = 5) => {
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('check_in_time', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as CheckIn[];
};

export const getUserBadges = async (userId: string) => {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) throw error;
  return data as Badge[];
};

export const getAllCheckIns = async (limit = 20) => {
  const { data, error } = await supabase
    .from('check_ins')
    .select(`
      *,
      profiles:user_id (username, avatar_url)
    `)
    .order('check_in_time', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

export const getLeaderboard = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('total_check_ins', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data as Profile[];
};

export const createCheckIn = async (checkIn: Omit<CheckIn, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('check_ins')
    .insert([checkIn])
    .select();

  if (error) throw error;
  return data;
};
