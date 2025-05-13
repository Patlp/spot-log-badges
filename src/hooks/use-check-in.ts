import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, createCheckIn, VenueType, saveVenue } from "@/lib/supabase";
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
      console.log("Starting check-in process with data:", data);
      console.log("User ID:", userId);
      console.log("Selected Place:", selectedPlace);
      
      if (!userId) {
        throw new Error("User ID is required for check-in");
      }
      
      try {
        // Create the check-in
        const checkInData = {
          user_id: userId,
          venue_name: data.venue_name,
          venue_type: data.venue_type as VenueType,
          location: data.location,
          check_in_time: data.check_in_time,
          notes: data.notes || "",
        };
        
        // Log right before saving venue
        console.log("About to store venue data (if available)");
        
        if (selectedPlace) {
          // Store the venue in our venues table for future reference
          console.log("Saving venue data with details:", selectedPlace);
          try {
            await saveVenue({
              place_id: selectedPlace.place_id,
              name: selectedPlace.name,
              address: selectedPlace.address,
              types: selectedPlace.types,
              latitude: selectedPlace.latitude,
              longitude: selectedPlace.longitude,
            });
            console.log("Venue saved successfully");
          } catch (venueError) {
            console.error("Venue storage error (non-critical):", venueError);
            // Continue with check-in even if venue storage fails
          }
        }
        
        // Log right before creating check-in
        console.log("About to create check-in with data:", checkInData);
        
        // STEP 3: Ensure the insert is being awaited properly
        console.log("Awaiting createCheckIn...");
        const checkInResult = await createCheckIn(checkInData);
        console.log("Check-in created successfully:", checkInResult);
        
        // TEMPORARILY COMMENT OUT badge awarding and profile stats for testing
        console.log("DEBUGGING: Skipping badge and profile updates for now");
        /*
        // Check if it's a first visit to this venue
        const { data: existingCheckins, error: checkError } = await supabase
          .from("check_ins")
          .select("id")
          .eq("user_id", userId)
          .eq("venue_name", data.venue_name)
          .order("created_at", { ascending: true });
          
        if (checkError) {
          console.error("Error checking existing check-ins:", checkError);
          throw checkError;
        }
        
        console.log("Found existing check-ins:", existingCheckins?.length || 0);
        
        // Determine which badge to award
        let badgeType = "";
        let badgeIcon = "";
        
        if (existingCheckins && existingCheckins.length === 1) {
          // First time at this venue
          badgeType = "first_visit";
          badgeIcon = "map-pin";
        } else if (existingCheckins && existingCheckins.length === 5) {
          // Fifth visit earns Regular badge
          badgeType = "regular";
          badgeIcon = "star";
        }
        
        // Award a badge if applicable
        if (badgeType) {
          console.log("Awarding badge:", badgeType);
          const { error: badgeError } = await supabase
            .from("badges")
            .insert([
              {
                user_id: userId,
                venue_name: data.venue_name,
                badge_type: badgeType,
                earned_at: new Date().toISOString(),
                icon: badgeIcon,
              },
            ]);
            
          if (badgeError) {
            console.error("Error awarding badge:", badgeError);
            throw badgeError;
          }
        }
          
        // Update the profile stats
        const { data: profileData } = await supabase
          .from("profiles")
          .select("total_check_ins, total_badges, unique_venues")
          .eq("id", userId)
          .single();
          
        if (profileData) {
          console.log("Updating profile stats:", profileData);
          
          // Calculate new values carefully to avoid nulls
          const newCheckIns = (profileData.total_check_ins || 0) + 1;
          const newBadges = badgeType ? (profileData.total_badges || 0) + 1 : (profileData.total_badges || 0);
          const newUniqueVenues = existingCheckins?.length === 1 ? (profileData.unique_venues || 0) + 1 : (profileData.unique_venues || 0);
          
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              total_check_ins: newCheckIns,
              total_badges: newBadges,
              unique_venues: newUniqueVenues,
            })
            .eq("id", userId);
            
          if (updateError) {
            console.error("Error updating profile stats:", updateError);
            throw updateError;
          }
        }
        */
        
        // Just for testing, return a simple success object
        return { success: true, data: checkInResult };
      } catch (error: any) {
        console.error("Check-in process error:", error);
        // Log detailed error info
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
    onSuccess: (data, variables) => {
      console.log("Check-in mutation succeeded:", data);
      
      // STEP 4: Temporarily simplify success handling for debugging
      console.log("DEBUGGING: Success! Simplified handling for testing");
      
      // Invalidate queries to refetch data but don't navigate or show toasts yet
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["checkIns"] });
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      queryClient.invalidateQueries({ queryKey: ["allCheckIns"] });
      
      // Simple debug toast instead of fancy one
      toast({
        title: "Debug: Check-in Processed",
        description: `Check-in function completed for ${variables.data.venue_name}`,
        variant: "default",
      });
      
      // Always set isSubmitting to false
      setIsSubmitting(false);
      
      // TEMPORARILY COMMENT OUT navigation for pure testing
      console.log("DEBUGGING: Would normally navigate to profile after 500ms");
      /*
      // Navigate to the profile page after successful check-in with a slight delay
      // to ensure toast is visible and state is updated
      setTimeout(() => {
        console.log("Navigating to profile page");
        navigate("/profile");
        
        // Call the success callback if provided
        if (options?.onSuccess) {
          console.log("Calling onSuccess callback");
          options.onSuccess();
        }
      }, 500);
      */
    },
    onError: (error: any) => {
      console.error("Check-in mutation failed with error:", error);
      console.error("Error type:", typeof error);
      if (error.message) console.error("Error message:", error.message);
      if (error.code) console.error("Error code:", error.code);
      if (error.details) console.error("Error details:", error.details);
      
      toast({
        title: "Check-in Failed",
        description: `Error: ${error.message || "Unknown error occurred"}`,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
    onSettled: () => {
      // Ensure isSubmitting is reset regardless of success/failure
      console.log("Check-in mutation settled");
      setIsSubmitting(false);
    }
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
