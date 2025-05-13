
import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCheckIn, VenueType, saveVenue } from "@/lib/supabase";
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
        
        // Create the check-in data - making sure venue_type is cast to VenueType
        const checkInData = {
          user_id: userId,
          venue_name: data.venue_name,
          venue_type: data.venue_type as VenueType,
          location: data.location,
          check_in_time: data.check_in_time,
          notes: data.notes || "",
        };
        
        // Try to save venue if available
        if (selectedPlace) {
          console.log("[useCheckIn] Saving venue data:", selectedPlace);
          try {
            await saveVenue({
              place_id: selectedPlace.place_id,
              name: selectedPlace.name,
              address: selectedPlace.address,
              types: selectedPlace.types,
              latitude: selectedPlace.latitude,
              longitude: selectedPlace.longitude,
            });
            console.log("[useCheckIn] Venue saved successfully");
          } catch (venueError) {
            console.error("[useCheckIn] Venue storage error:", venueError);
            // Continue with check-in even if venue storage fails
          }
        }
        
        // Create the check-in
        console.log("[useCheckIn] Creating check-in with data:", checkInData);
        
        const checkInResult = await createCheckIn(checkInData);
        console.log("[useCheckIn] Check-in created successfully:", checkInResult);
        return { success: true, data: checkInResult };
      } catch (error: any) {
        console.error("[useCheckIn] Check-in process error:", error);
        throw error;
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
      
      // IMPORTANT: First show toast and THEN reset state before navigation
      toast({
        title: "Check-in Successful!",
        description: "Your check-in has been recorded.",
        duration: 3000,
      });
      
      // Reset the submission state BEFORE navigation
      setIsSubmitting(false);
      
      // Call the success callback if provided
      if (options?.onSuccess) {
        options.onSuccess();
      }

      // Use a small delay before navigation to ensure toast is visible
      // and state updates have been processed
      setTimeout(() => {
        navigateToProfile();
      }, 500);
    },
    onError: (error: any) => {
      console.error("[useCheckIn] Mutation failed:", error);
      
      // Reset submission state immediately on error
      setIsSubmitting(false);
      
      // Set the error state
      setCheckInError(error.message || "Unknown error occurred");
      
      // Show error toast
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
