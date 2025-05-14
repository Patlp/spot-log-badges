
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckInFormValues } from "@/components/check-in/ManualCheckInForm";

type UseCheckInProps = {
  onSuccess?: () => void;
};

export const useCheckIn = (props?: UseCheckInProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  const checkIn = async (testData: any) => {
    console.log("Check-in started", testData);
    try {
      const { data, error } = await supabase
        .from("check_ins")
        .insert([testData])
        .select();

      console.log("Insert result:", { data, error });

      if (error) {
        console.error("Insert error:", error);
        alert("Check-in failed: " + error.message);
        return;
      }

      alert("Check-in successful!");
    } catch (e: any) {
      console.error("Unexpected error:", e);
      alert("Unexpected error: " + e.message);
    }
  };

  const handleCheckIn = async (formData: CheckInFormValues, userId: string, selectedPlace: any = null) => {
    console.log("[useCheckIn] Starting check-in process", { formData, userId });
    
    setIsSubmitting(true);
    setCheckInError(null);
    
    try {
      // Prepare the check-in data
      const checkInData = {
        user_id: userId,
        venue_name: formData.venue_name,
        venue_type: formData.venue_type,
        location: formData.location,
        check_in_time: formData.check_in_time,
        notes: formData.notes || null
      };
      
      console.log("[useCheckIn] Prepared check-in data:", checkInData);
      
      // Use the original checkIn function that works
      await checkIn(checkInData);
      
      // Show success message
      toast({
        title: "Check-in Successful!",
        description: `You checked in at ${formData.venue_name}`,
        duration: 5000,
      });
      
      // Call the onSuccess callback if provided
      if (props?.onSuccess) {
        setTimeout(() => {
          props.onSuccess?.();
        }, 1000);
      }
      
    } catch (error: any) {
      console.error("[useCheckIn] Error:", error);
      setCheckInError(error.message || "An error occurred during check-in");
      
      toast({
        title: "Check-in Failed",
        description: error.message || "There was a problem with your check-in",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { 
    checkIn,
    isSubmitting,
    checkInError,
    handleCheckIn
  };
};
