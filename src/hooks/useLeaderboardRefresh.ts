import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAccurateLeaderboard } from "../lib/supabase";

export const useLeaderboardRefresh = () => {
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());

  // Use the getAccurateLeaderboard function with a timestamp-based key for forced refreshes
  const { data: leaderboard, isLoading, refetch: refetchLeaderboard } = useQuery({
    queryKey: ["accurate-leaderboard", lastRefreshTime],
    queryFn: getAccurateLeaderboard,
    staleTime: 0, // Consider data always stale to ensure fresh fetches
    refetchOnWindowFocus: true, // Always refetch when window gets focus
    refetchOnMount: 'always', // Always refetch when component mounts
  });

  // Enhanced refresh on window focus with timestamp update to force new data
  useEffect(() => {
    const onFocus = () => {
      console.log("Window focused, refreshing leaderboard");
      setLastRefreshTime(Date.now()); // Update timestamp to force refetch
    };
    
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Immediate refresh on mount with timestamp update
  useEffect(() => {
    // Force an immediate refresh on component mount
    console.log("Component mounted, refreshing leaderboard");
    refetchLeaderboard();
  }, [refetchLeaderboard]);

  // Poll for updates more frequently (every 10 seconds) to keep data fresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("Polling interval, refreshing leaderboard");
      setLastRefreshTime(Date.now()); // Update timestamp to force refetch
    }, 10000); // 10 seconds (changed from 30 seconds)
    
    return () => clearInterval(intervalId);
  }, []);

  // Track route changes to refresh data when navigating back to leaderboard
  useEffect(() => {
    console.log("LeaderboardPage rendered, refreshing data");
    setLastRefreshTime(Date.now());
  }, []);

  return {
    leaderboard,
    isLoading,
    refetchLeaderboard,
    lastRefreshTime,
    setLastRefreshTime
  };
};
