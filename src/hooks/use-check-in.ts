import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCheckIn } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { CheckInFormValues } from "@/components/check-in/ManualCheckInForm";
import { Place } from "@/components/check-in/PlacesList";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; // Added this import for the direct Supabase client

interface UseCheckInOptions {
  onSuccess?: () => void;
}

export const useCheckIn = (options?: UseCheckInOptions) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // The mutation setup with enhanced error handling
  const checkInMutation = useMutation({
    mutationFn: async ({ 
      data, 
      userId, 
      selectedPlace 
    }: { 
      data: CheckInFormValues; 
      userId: string; 
      selectedPlace: Place | null 
    }) => {
      try {
        console.log("[useCheckIn] Starting check-in process with data:", data);
        console.log("[useCheckIn] User ID:", userId);
        console.log("[useCheckIn] Selected Place:", selectedPlace);
        
        if (!userId) {
          throw new Error("User ID is required for check-in");
        }
        
        // Create the check-in data
        const checkInData = {
          user_id: userId,
          venue_name: data.venue_name,
          venue_type: data.venue_type,
          location: data.location,
          check_in_time: data.check_in_time,
          notes: data.notes || "",
        };
        
        console.log("[useCheckIn] Check-in data prepared:", checkInData);
        
        // DEBUGGING STEP 1: Log the full payload being sent
        console.log("[useCheckIn] FULL PAYLOAD BEING SENT:", JSON.stringify(checkInData, null, 2));
        
        // DEBUGGING STEP 2: Test with hardcoded payload
        // Uncomment this to test with hardcoded data
        // const hardcodedData = {
        //   user_id: userId, // Keep the real user ID
        //   venue_name: "Test Place",
        //   venue_type: "Restaurant", 
        //   location: "Test Location",
        //   check_in_time: new Date().toISOString(),
        //   notes: "Test note"
        // };
        // console.log("[useCheckIn] Using HARDCODED test data:", hardcodedData);
        
        // Create the check-in with explicit try/catch
        try {
          console.log("[useCheckIn] Check-in started", { checkInData });
          const { data: resultData, error } = await supabase
            .from("check_ins")
            .insert([checkInData])
            .select()
            .throwOnError(); // DEBUGGING STEP 4: Add throwOnError to surface RLS issues
            
          console.log("[useCheckIn] Insert result:", { resultData, error });
          
          if (error) {
            console.error("[useCheckIn] Insert failed with error:", error);
            throw new Error(error.message || "Failed to create check-in");
          }
          
          if (!resultData || resultData.length === 0) {
            console.error("[useCheckIn] No data returned after successful insert");
            throw new Error("No data returned from insert operation");
          }
          
          console.log("[useCheckIn] Check-in completed successfully:", resultData);
          return resultData[0];
        } catch (insertError: any) {
          console.error("[useCheckIn] Check-in insert error:", insertError);
          console.error("[useCheckIn] Error details:", {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
            stack: insertError.stack
          });
          
          // Alert for immediate feedback during debugging
          alert("Check-in failed: " + (insertError.message || "Unknown error"));
          throw insertError;
        }
      } catch (error: any) {
        console.error("[useCheckIn] Check-in process error:", error);
        // Alert for immediate feedback during debugging
        alert("Check-in failed: " + (error.message || "Unknown error"));
        throw error; // Rethrow for the mutation error handler
      }
    },
    onMutate: () => {
      console.log("[useCheckIn] Mutation starting");
      setIsSubmitting(true);
      setCheckInError(null);
    },
    onSuccess: (data) => {
      console.log("[useCheckIn] Mutation succeeded:", data);
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["checkIns"] });
      
      // Reset the submission state
      setIsSubmitting(false);
      
      // Call the success callback if provided
      if (options?.onSuccess) {
        options.onSuccess();
      }

      // Temporarily disable navigation to isolate the check-in functionality
      console.log("[useCheckIn] Success - navigation disabled for testing");
      // navigate("/profile");
    },
    onError: (error: any) => {
      console.log("[useCheckIn] Mutation failed:", error);
      
      // Reset submission state immediately on error
      setIsSubmitting(false);
      
      // Set the error state
      setCheckInError(error.message || "Unknown error occurred");
      
      // Alert for immediate feedback during debugging
      console.error("[useCheckIn] Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack
      });
    }
  });

  // Simplified check-in handler with better error boundary
  const handleCheckIn = useCallback((data: CheckInFormValues, userId: string, selectedPlace: Place | null) => {
    console.log("[useCheckIn] handleCheckIn called with:", { data, userId });
    
    if (isSubmitting) {
      console.log("[useCheckIn] Already submitting, ignoring duplicate call");
      return;
    }
    
    if (!userId) {
      alert("Authentication Required: You must be logged in to check in.");
      return;
    }
    
    // Check for missing required fields
    if (!data.venue_name || !data.venue_type || !data.location || !data.check_in_time) {
      alert("Missing Information: Please fill out all required fields.");
      return;
    }
    
    try {
      // Call the mutation with explicit error handling
      console.log("[useCheckIn] Triggering check-in mutation...");
      checkInMutation.mutate({ data, userId, selectedPlace });
    } catch (error: any) {
      // Catch any synchronous errors (should be rare with async mutation)
      console.error("[useCheckIn] Unexpected error during mutation trigger:", error);
      setIsSubmitting(false);
      setCheckInError(error.message || "An unexpected error occurred");
      alert("Check-in Failed: " + (error.message || "An unexpected error occurred"));
    }
  }, [isSubmitting, checkInMutation]);

  return {
    isSubmitting,
    checkInError,
    handleCheckIn
  };
};
