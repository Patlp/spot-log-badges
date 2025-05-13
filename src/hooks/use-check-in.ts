
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { createCheckIn, VenueType, saveVenue } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { CheckInFormValues } from "@/components/check-in/ManualCheckInForm";
import { Place } from "@/components/check-in/PlacesList";
import { useNavigate } from "react-router-dom";

interface UseCheckInOptions {
  onSuccess?: () => void;
}

export const useCheckIn = (options?: UseCheckInOptions) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
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
        
        // Create the check-in with a timeout
        console.log("Creating check-in with data:", checkInData);
        const checkInResult = await Promise.race([
          createCheckIn(checkInData),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Check-in timeout after 10s")), 10000)
          )
        ]);
        
        console.log("Check-in created successfully:", checkInResult);
        return { success: true, data: checkInResult };
      } catch (error: any) {
        console.error("Check-in process error:", error);
        console.error("Error type:", typeof error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        if (error.code) console.error("Error code:", error.code);
        if (error.details) console.error("Error details:", error.details);
        throw error;
      }
    },
    onMutate: () => {
      console.log("Check-in mutation starting");
      setIsSubmitting(true);
    },
    onSuccess: (data) => {
      console.log("Check-in mutation succeeded:", data);
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["checkIns"] });
      
      // Show success toast
      toast({
        title: "Check-in Successful!",
        description: "Your check-in has been recorded.",
        variant: "default",
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
      
      // Show error toast with specific message
      toast({
        title: "Check-in Failed",
        description: `Error: ${error.message || "Unknown error occurred"}`,
        variant: "destructive",
      });
      
      // Ensure isSubmitting is reset
      setIsSubmitting(false);
    },
    onSettled: () => {
      // Ensure isSubmitting is reset regardless of success/failure
      console.log("Check-in mutation settled");
      setIsSubmitting(false);
    },
    retry: 0, // Don't retry failed mutations - better to show error and let user try again
  });

  const handleCheckIn = (data: CheckInFormValues, userId: string, selectedPlace: Place | null) => {
    console.log("handleCheckIn called with:", { data, userId });
    
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to check in.",
        variant: "destructive",
      });
      return;
    }
    
    // Check for missing required fields
    if (!data.venue_name || !data.venue_type || !data.location || !data.check_in_time) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Call the mutation
    console.log("Triggering check-in mutation...");
    checkInMutation.mutate({ data, userId, selectedPlace });
  };

  return {
    isSubmitting,
    handleCheckIn
  };
};
