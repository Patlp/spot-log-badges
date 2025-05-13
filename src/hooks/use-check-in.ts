
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
        
        if (selectedPlace) {
          // Store the venue in our venues table for future reference
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
            console.error("Venue storage error (non-critical):", venueError);
            // Continue with check-in even if venue storage fails
          }
        }
        
        console.log("Creating check-in with data:", checkInData);
        const checkInResult = await createCheckIn(checkInData);
        console.log("Check-in created:", checkInResult);
        
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
          
          await supabase
            .from("profiles")
            .update({
              total_check_ins: newCheckIns,
              total_badges: newBadges,
              unique_venues: newUniqueVenues,
            })
            .eq("id", userId);
        }
        
        return { badgeEarned: badgeType };
      } catch (error) {
        console.error("Check-in process error:", error);
        throw error;
      }
    },
    onMutate: () => {
      console.log("Check-in mutation starting");
      setIsSubmitting(true);
    },
    onSuccess: (data, variables) => {
      console.log("Check-in successful:", data);
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["checkIns"] });
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      queryClient.invalidateQueries({ queryKey: ["allCheckIns"] });
      
      // Show success toast immediately
      if (data.badgeEarned) {
        toast({
          title: "Badge Earned! 🏆",
          description: `You've earned a ${data.badgeEarned.replace('_', ' ')} badge for ${variables.data.venue_name}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Check-in Successful!",
          description: `You've checked in at ${variables.data.venue_name}`,
          variant: "default",
        });
      }
      
      setIsSubmitting(false);
      
      // Navigate to the profile page after successful check-in
      console.log("Navigating to profile page");
      navigate("/profile");
      
      // Call the success callback if provided
      if (options?.onSuccess) {
        console.log("Calling onSuccess callback");
        options.onSuccess();
      }
    },
    onError: (error) => {
      console.error("Check-in error:", error);
      toast({
        title: "Check-in Failed",
        description: error.message || "There was a problem with your check-in. Please try again.",
        variant: "destructive",
      });
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
      });
      setIsSubmitting(false);
      return;
    }
    
    checkInMutation.mutate({ data, userId, selectedPlace });
  };

  return {
    isSubmitting,
    handleCheckIn
  };
};
