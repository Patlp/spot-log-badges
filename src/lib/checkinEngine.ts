
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { awardFirstVisitBadge } from "@/lib/supabase";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Define check-in data type
export type CheckInData = {
  user_id: string;
  venue_name: string;
  venue_type: string;
  location: string;
  check_in_time: string;
  notes?: string;
};

// Central check-in engine function that manages all check-ins
// DO NOT MODIFY this function. It powers all check-in buttons across the app. Any changes must be tested on:
// - Nearby Place check-in
// - Manual Entry check-in
// - Test Button check-in
export const processCheckIn = async (checkInData: CheckInData, options?: { 
  onSuccess?: () => void,
  enableRedirect?: boolean,
  enableToasts?: boolean,
  enableBadges?: boolean,
  debugMode?: boolean
}) => {
  // Default options
  const {
    onSuccess,
    enableRedirect = true,
    enableToasts = true,
    enableBadges = true,
    debugMode = false
  } = options || {};

  // Set debug mode to capture all events
  const debug = (msg: string, data?: any) => {
    if (debugMode) {
      if (data) {
        console.log(`[CheckInEngine] ${msg}`, data);
      } else {
        console.log(`[CheckInEngine] ${msg}`);
      }
    }
  };

  debug("Starting check-in process", checkInData);
  
  try {
    debug("Validating check-in data");
    // Validate required fields
    if (!checkInData.user_id) throw new Error("Missing user_id");
    if (!checkInData.venue_name) throw new Error("Missing venue name");
    if (!checkInData.venue_type) throw new Error("Missing venue type");
    if (!checkInData.location) throw new Error("Missing location");
    if (!checkInData.check_in_time) throw new Error("Missing check-in time");
    
    // 1. Insert the check-in data
    debug("Inserting check-in data");
    const { data, error } = await supabase
      .from("check_ins")
      .insert([checkInData])
      .select();

    debug("Insert result", { data, error });

    if (error) {
      debug("Insert error", error);
      if (enableToasts) {
        toast({
          title: "Check-in Failed",
          description: error.message || "There was a problem with your check-in",
          variant: "destructive",
          duration: 5000,
        });
      }
      return { success: false, error };
    }

    debug("Check-in successful");
    
    // 2. Try to award a badge, but don't let it interfere with the check-in process
    let badgeAwarded = false;
    if (enableBadges) {
      try {
        debug("Attempting to award badge");
        // Only attempt to award a badge if we have the required data
        if (data && data[0] && checkInData.user_id && checkInData.venue_name) {
          badgeAwarded = await awardFirstVisitBadge(
            checkInData.user_id, 
            checkInData.venue_name
          );
          
          debug("Badge award result", badgeAwarded);
          
          if (badgeAwarded && enableToasts) {
            toast({ 
              title: "Badge Earned!", 
              description: "You earned a First Visit badge for checking in here for the first time.",
              variant: "default" 
            });
          }
        }
      } catch (badgeError) {
        // Log badge error but don't fail the check-in
        debug("Error awarding badge (non-critical)", badgeError);
      }
    }

    // 3. Call the onSuccess callback if provided
    if (onSuccess) {
      debug("Calling onSuccess callback");
      onSuccess();
    }
    
    // 4. Show success toast
    if (enableToasts) {
      debug("Showing success toast");
      toast({
        title: "Check-in complete!",
        description: `Successfully checked in at ${checkInData.venue_name}`,
        variant: "default"
      });
    }
    
    // Return success
    debug("Check-in process complete");
    return { 
      success: true, 
      data, 
      badgeAwarded,
      enableRedirect, 
      venueName: checkInData.venue_name 
    };
  } catch (e: any) {
    debug("Unexpected error", e);
    if (enableToasts) {
      toast({
        title: "Check-in Failed",
        description: e.message || "There was a problem with your check-in",
        variant: "destructive",
        duration: 5000,
      });
    }
    return { success: false, error: e };
  }
};

// Hook for using the check-in engine in components
export const useCheckInEngine = (options?: {
  onSuccess?: () => void;
  enableRedirect?: boolean;
  enableToasts?: boolean;
  enableBadges?: boolean;
  debugMode?: boolean;
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleCheckIn = async (checkInData: CheckInData) => {
    if (isSubmitting) {
      console.log("[CheckInEngine] Check-in already in progress, preventing duplicate submission");
      return { success: false, error: new Error("Check-in already in progress") };
    }
    
    setIsSubmitting(true);
    console.log("[CheckInEngine] Check-in started with data:", checkInData);
    
    try {
      const result = await processCheckIn(checkInData, options);
      
      console.log("[CheckInEngine] Check-in result:", result);
      
      // Handle navigation if enabled and successful
      if (result.success && options?.enableRedirect !== false) {
        console.log("[CheckInEngine] Navigating to profile");
        navigate("/profile");
      }
      
      return result;
    } catch (error) {
      console.error("[CheckInEngine] Error in handleCheckIn:", error);
      return { success: false, error };
    } finally {
      console.log("[CheckInEngine] Resetting isSubmitting state");
      setIsSubmitting(false);
    }
  };
  
  return {
    checkIn: handleCheckIn,
    isSubmitting
  };
};
