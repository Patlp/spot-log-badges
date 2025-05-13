
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
        console.log("Starting check-in process with data:", data);
        console.log("User ID:", userId);
        console.log("Selected Place:", selectedPlace);
        
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
          console.log("Saving venue data:", selectedPlace);
          try {
            await saveVenue({
              place_id: selectedPlace.place_id,
              name: selectedPlace.name,
              address: selectedPlace.address,
              types: selectedPlace.types,
              latitude: selectedPlace.latitude,
              longitude: selectedPlace.longitude,
            });
          } catch (venueError) {
            console.error("Venue storage error:", venueError);
            // Continue with check-in even if venue storage fails
          }
        }
        
        // Create the check-in
        console.log("Creating check-in with data:", checkInData);
        
        try {
          const checkInResult = await createCheckIn(checkInData);
          console.log("Check-in created successfully:", checkInResult);
          return { success: true, data: checkInResult };
        } catch (error: any) {
          console.error("Check-in creation error:", error);
          throw new Error(`Check-in failed: ${error.message || "Unknown error"}`);
        }
      } catch (error: any) {
        console.error("Check-in process error:", error);
        throw error;
      }
    },
    onMutate: () => {
      console.log("Check-in mutation starting");
      setIsSubmitting(true);
      setCheckInError(null);
    },
    onSuccess: (data) => {
      console.log("Check-in mutation succeeded:", data);
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["checkIns"] });
      
      // Show success toast with fixed duration
      toast({
        title: "Check-in Successful!",
        description: "Your check-in has been recorded.",
        variant: "default",
        duration: 5000, // Explicitly set duration
      });
      
      // Navigate to profile page
      navigate("/profile");
      
      // Call the success callback if provided
      if (options?.onSuccess) {
        options.onSuccess();
      }
      
      // Ensure isSubmitting is reset
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      console.error("Check-in mutation failed:", error);
      
      // Set the error state
      setCheckInError(error.message || "Unknown error occurred");
      
      // Show error toast with specific message and duration
      toast({
        title: "Check-in Failed",
        description: `Error: ${error.message || "Unknown error occurred"}`,
        variant: "destructive",
        duration: 7000, // Give more time to read error messages
      });
      
      // Ensure isSubmitting is reset
      setIsSubmitting(false);
    },
    onSettled: () => {
      // Ensure isSubmitting is reset regardless of success/failure
      console.log("Check-in mutation settled");
      setIsSubmitting(false);
    },
  });

  const handleCheckIn = (data: CheckInFormValues, userId: string, selectedPlace: Place | null) => {
    console.log("handleCheckIn called with:", { data, userId });
    
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to check in.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    
    // Check for missing required fields
    if (!data.venue_name || !data.venue_type || !data.location || !data.check_in_time) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    
    // Call the mutation
    console.log("Triggering check-in mutation...");
    checkInMutation.mutate({ data, userId, selectedPlace });
  };

  return {
    isSubmitting,
    checkInError,
    handleCheckIn
  };
};
