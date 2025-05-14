
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { awardFirstVisitBadge } from "@/lib/supabase";
import { useState } from "react";

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
      // 1. Insert the check-in data
      const { data, error } = await supabase
        .from("check_ins")
        .insert([checkInData])
        .select();

      console.log("Insert result:", { data, error });

      if (error) {
        console.error("Insert error:", error);
        toast({
          title: "Check-in Failed",
          description: error.message || "There was a problem with your check-in",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      // 2. Try to award a badge, but don't let it interfere with the check-in process
      try {
        // Only attempt to award a badge if we have the required data
        if (data && data[0] && checkInData.user_id && checkInData.venue_name) {
          console.log("Attempting to award first visit badge");
          const badgeAwarded = await awardFirstVisitBadge(
            checkInData.user_id, 
            checkInData.venue_name
          );
          
          if (badgeAwarded) {
            toast({ 
              title: "Badge Earned!", 
              description: "You earned a First Visit badge for checking in here for the first time.",
              variant: "default" 
            });
          }
        }
      } catch (badgeError) {
        // Log badge error but don't fail the check-in
        console.error("Error awarding badge (non-critical):", badgeError);
      }

      // 3. Call the onSuccess callback if provided
      if (props?.onSuccess) {
        props.onSuccess();
      }
      
      // 4. Show success toast
      toast({
        title: "Check-in complete!",
        description: `Successfully checked in at ${checkInData.venue_name}`,
        variant: "default"
      });
      
      // 5. Navigate to profile page after successful check-in
      navigate("/profile");
      
      return data;
    } catch (e: any) {
      console.error("Unexpected error:", e);
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
