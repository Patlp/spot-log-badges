
import { useState } from "react";
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
      
      // Show success toast
      toast({
        title: "Check-in Successful!",
        description: "Your check-in has been recorded.",
        duration: 5000,
      });
      
      // Call the success callback if provided
      if (options?.onSuccess) {
        options.onSuccess();
      }

      // Small delay before navigation to ensure toast is shown
      setTimeout(() => {
        navigate("/profile");
        setIsSubmitting(false);
      }, 500);
    },
    onError: (error: any) => {
      console.error("[useCheckIn] Mutation failed:", error);
      
      // Set the error state
      setCheckInError(error.message || "Unknown error occurred");
      
      // Show error toast
      toast({
        title: "Check-in Failed",
        description: `Error: ${error.message || "Unknown error occurred"}`,
        duration: 7000, // Give more time to read error messages
      });
      
      // Reset submission state
      setIsSubmitting(false);
    },
    onSettled: () => {
      // Ensure state is reset after a timeout if not already reset
      const timeoutId = setTimeout(() => {
        if (isSubmitting) {
          console.log("[useCheckIn] Force resetting isSubmitting state");
          setIsSubmitting(false);
        }
      }, 10000); // 10 seconds safety timeout
      
      return () => clearTimeout(timeoutId);
    },
  });

  const handleCheckIn = (data: CheckInFormValues, userId: string, selectedPlace: Place | null) => {
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
      });
      return;
    }
    
    // Check for missing required fields
    if (!data.venue_name || !data.venue_type || !data.location || !data.check_in_time) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields.",
        duration: 5000,
      });
      return;
    }
    
    // Call the mutation
    console.log("[useCheckIn] Triggering check-in mutation...");
    checkInMutation.mutate({ data, userId, selectedPlace });
  };

  return {
    isSubmitting,
    checkInError,
    handleCheckIn
  };
};
