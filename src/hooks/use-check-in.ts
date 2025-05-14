
// DO NOT MODIFY THIS FILE — This component is part of the working check-in system. 
// Any changes may break the Nearby, Manual, or Test check-in workflows.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { processCheckIn } from "@/lib/checkinEngine";
import { debugLog, isDebugMode } from "@/lib/debugMode";

type UseCheckInProps = {
  onSuccess?: () => void;
};

export const useCheckIn = (props?: UseCheckInProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // DO NOT MODIFY this function. It powers all check-in buttons across the app. Any changes must be tested on:
  // - Nearby Place check-in
  // - Manual Entry check-in
  // - Test Button check-in
  const handleCheckInSubmission = async (checkInData: any) => {
    if (isSubmitting) {
      debugLog("useCheckIn", "Check-in already in progress, preventing duplicate submission");
      return;
    }
    
    if (isDebugMode) {
      toast({
        title: "Debug: Check-in started",
        description: `Venue: ${checkInData.venue_name}`,
        variant: "default",
      });
    }
    
    debugLog("useCheckIn", "Check-in started", checkInData);
    setIsSubmitting(true);
    
    try {
      // Forward to our new centralized check-in engine
      debugLog("useCheckIn", "Forwarding to check-in engine", checkInData);
      const result = await processCheckIn(checkInData, {
        onSuccess: props?.onSuccess,
        debugMode: isDebugMode
      });
      
      debugLog("useCheckIn", "Check-in engine result:", result);
      
      // Handle navigation to profile if successful
      if (result.success) {
        navigate("/profile");
      }
      
      return result.data;
    } catch (e: any) {
      console.error("Unexpected error in useCheckIn:", e);
      toast({
        title: "Check-in Failed",
        description: e.message || "There was a problem with your check-in",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { 
    checkIn: handleCheckInSubmission,
    isSubmitting
  };
};
