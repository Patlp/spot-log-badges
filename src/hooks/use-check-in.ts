
import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCheckIn } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { CheckInFormValues } from "@/components/check-in/ManualCheckInForm";
import { Place } from "@/components/check-in/PlacesList";
import { useNavigate } from "react-router-dom";

interface UseCheckInOptions {
  onSuccess?: () => void;
}

export const useCheckIn = (options?: UseCheckInOptions) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Create a separate function to handle navigation safely
  const navigateToProfile = useCallback(() => {
    console.log("[useCheckIn] Navigating to profile page");
    navigate("/profile");
  }, [navigate]);
  
  // The mutation setup
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
        
        // Create the check-in directly without wrappers
        console.log("[useCheckIn] Calling createCheckIn function");
        const checkInResult = await createCheckIn(checkInData);
        console.log("[useCheckIn] Check-in created successfully:", checkInResult);
        
        return { success: true, data: checkInResult };
      } catch (error: any) {
        console.error("[useCheckIn] Check-in process error:", error);
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
      
      // Show toast
      toast({
        title: "Check-in Successful!",
        description: "Your check-in has been recorded.",
        duration: 3000,
      });
      
      // Reset the submission state
      setIsSubmitting(false);
      
      // Call the success callback if provided
      if (options?.onSuccess) {
        options.onSuccess();
      }

      // Use a small delay before navigation to ensure toast is visible
      setTimeout(() => {
        navigateToProfile();
      }, 500);
    },
    onError: (error: any) => {
      console.log("[useCheckIn] Mutation failed:", error);
      
      // Reset submission state immediately on error
      setIsSubmitting(false);
      
      // Set the error state
      setCheckInError(error.message || "Unknown error occurred");
      
      // Show error toast with detailed error message
      toast({
        title: "Check-in Failed",
        description: `Error: ${error.message || "Unknown error occurred"}`,
        duration: 5000,
        variant: "destructive"
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
      toast({
        title: "Authentication Required",
        description: "You must be logged in to check in.",
        duration: 5000,
        variant: "warning"
      });
      return;
    }
    
    // Check for missing required fields
    if (!data.venue_name || !data.venue_type || !data.location || !data.check_in_time) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields.",
        duration: 5000,
        variant: "warning"
      });
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
      
      toast({
        title: "Check-in Failed",
        description: "There was an unexpected error. Please try again.",
        duration: 5000,
        variant: "destructive"
      });
    }
  }, [isSubmitting, checkInMutation]);

  return {
    isSubmitting,
    checkInError,
    handleCheckIn
  };
};
