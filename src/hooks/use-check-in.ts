
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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

      // Call the onSuccess callback if provided
      if (props?.onSuccess) {
        props.onSuccess();
      }
      
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
