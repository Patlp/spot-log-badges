
import { supabase } from "@/integrations/supabase/client";

export const useCheckIn = () => {
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

  return { checkIn };
};
