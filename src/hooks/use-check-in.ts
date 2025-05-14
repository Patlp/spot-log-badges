
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { processCheckIn } from "@/lib/checkinEngine";

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
      console.log("Check-in already in progress, preventing duplicate submission");
      return;
    }
    
    console.log("Check-in started", checkInData);
    setIsSubmitting(true);
    
    try {
      // Forward to our new centralized check-in engine
      console.log("Forwarding to check-in engine", checkInData);
      const result = await processCheckIn(checkInData, {
        onSuccess: props?.onSuccess,
        debugMode: true
      });
      
      console.log("Check-in engine result:", result);
      
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
