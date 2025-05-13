
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, createCheckIn, VenueType, saveVenue } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { CheckInFormValues } from "@/components/check-in/ManualCheckInForm";
import { Place } from "@/services/places";

interface UseCheckInOptions {
  onSuccess?: () => void;
}

export const useCheckIn = (options?: UseCheckInOptions) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
      setIsSubmitting(true);
      
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
        
        await createCheckIn(checkInData);
        
        // Check if it's a first visit to this venue
        const { data: existingCheckins, error: checkError } = await supabase
          .from("check_ins")
          .select("id")
          .eq("user_id", userId)
          .eq("venue_name", data.venue_name)
          .order("created_at", { ascending: true });
          
        if (checkError) throw checkError;
        
        // Determine which badge to award
        let badgeType = "";
        let badgeIcon = "";
        
        if (existingCheckins.length === 1) {
          // First time at this venue
          badgeType = "first_visit";
          badgeIcon = "map-pin";
        } else if (existingCheckins.length === 5) {
          // Fifth visit earns Regular badge
          badgeType = "regular";
          badgeIcon = "star";
        }
        
        // Award a badge if applicable
        if (badgeType) {
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
            
          if (badgeError) throw badgeError;
          
          // Update the profile stats
          const { data: profileData } = await supabase
            .from("profiles")
            .select("total_check_ins, total_badges, unique_venues")
            .eq("id", userId)
            .single();
            
          if (profileData) {
            await supabase
              .from("profiles")
              .update({
                total_check_ins: profileData.total_check_ins + 1,
                total_badges: badgeType ? profileData.total_badges + 1 : profileData.total_badges,
                unique_venues: existingCheckins.length === 1 ? profileData.unique_venues + 1 : profileData.unique_venues,
              })
              .eq("id", userId);
          }
          
          return { badgeEarned: badgeType };
        } else {
          // Just update check-in count if no badge earned
          const { data: profileData } = await supabase
            .from("profiles")
            .select("total_check_ins")
            .eq("id", userId)
            .single();
            
          if (profileData) {
            await supabase
              .from("profiles")
              .update({
                total_check_ins: profileData.total_check_ins + 1,
              })
              .eq("id", userId);
          }
          
          return { badgeEarned: null };
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["checkIns"] });
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      queryClient.invalidateQueries({ queryKey: ["allCheckIns"] });
      
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
      
      // Call the success callback if provided
      if (options?.onSuccess) {
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
    },
  });

  const handleCheckIn = (data: CheckInFormValues, userId: string, selectedPlace: Place | null) => {
    checkInMutation.mutate({ data, userId, selectedPlace });
  };

  return {
    isSubmitting,
    handleCheckIn
  };
};
