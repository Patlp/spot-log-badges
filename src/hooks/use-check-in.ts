
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { awardFirstVisitBadge } from "@/lib/supabase";

type UseCheckInProps = {
  onSuccess?: () => void;
};

export const useCheckIn = (props?: UseCheckInProps) => {
  const navigate = useNavigate();
  
  const checkIn = async (checkInData: any) => {
    console.log("Check-in started", checkInData);
    try {
      const { data, error } = await supabase
        .from("check_ins")
        .insert([checkInData])
        .select();

      console.log("Insert result:", { data, error });

      if (error) {
        console.error("Insert error:", error);
        throw new Error(error.message);
      }

      // Try to award a badge, but don't let it interfere with the check-in process
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

      // Call the onSuccess callback if provided
      if (props?.onSuccess) {
        props.onSuccess();
      }
      
      // Show success toast
      toast({
        title: "Check-in complete!",
        description: `Successfully checked in at ${checkInData.venue_name}`,
        variant: "default"
      });
      
      // Navigate to profile page after successful check-in
      navigate("/profile");
      
      return data;
    } catch (e: any) {
      console.error("Unexpected error:", e);
      throw e;
    }
  };

  return { checkIn };
};
