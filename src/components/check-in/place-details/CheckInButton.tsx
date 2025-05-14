
// DO NOT MODIFY THIS FILE — This component is part of the working check-in system. 
// Any changes may break the Nearby, Manual, or Test check-in workflows.

import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Place } from "../PlacesList";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useCheckInEngine } from "@/lib/checkinEngine";
import { useContext } from "react";
import { AuthContext } from "../../../App";

interface CheckInButtonProps {
  isFormSubmitting: boolean;
  selectedPlace: Place;
}

export function CheckInButton({ isFormSubmitting, selectedPlace }: CheckInButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Use our check-in engine with optimized settings
  const { checkIn } = useCheckInEngine({ 
    debugMode: true,
    enableRedirect: false, // We'll handle redirection manually
    enableToasts: true
  });

  const handleCheckIn = async () => {
    // Prevent check-in if no user is logged in
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to check in",
        variant: "destructive"
      });
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting || isFormSubmitting) {
      return;
    }

    try {
      // Set loading state
      setIsSubmitting(true);
      
      // Get form values from parent component (they should be already set)
      const form = document.querySelector('form');
      const formData = new FormData(form as HTMLFormElement);
      const checkInTime = formData.get('check_in_time') as string;
      const notes = formData.get('notes') as string;
      
      // Prepare check-in data
      const checkInData = {
        user_id: user.id,
        venue_name: selectedPlace.name,
        venue_type: selectedPlace.types[0], // Use first type as venue type
        location: selectedPlace.address,
        check_in_time: checkInTime,
        notes: notes
      };
      
      // Log for debugging
      console.log("CheckInButton: Submitting check-in", checkInData);
      
      // Show initial toast
      toast({
        title: "Checking in...",
        description: `Processing check-in at ${selectedPlace.name}`,
        variant: "default"
      });

      // Execute check-in via engine
      const result = await checkIn(checkInData);
      
      console.log("CheckInButton: Check-in result", result);
      
      if (result.success) {
        // Show success toast
        toast({
          title: "Check-in Complete!",
          description: `Successfully checked in at ${selectedPlace.name}`,
          variant: "default"
        });
        
        // If badge was awarded, show badge toast
        if (result.badgeAwarded) {
          toast({
            title: "Badge Earned!",
            description: "You earned a First Visit badge!",
            variant: "default"
          });
        }
        
        // Use a short timeout to ensure toasts are visible, then redirect
        setTimeout(() => {
          navigate("/profile");
        }, 1000);
      }
    } catch (error) {
      console.error("CheckInButton: Error during check-in:", error);
      toast({
        title: "Check-in Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || isFormSubmitting;

  return (
    <Button
      type="button"
      onClick={handleCheckIn}
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Checking In at {selectedPlace.name}...
        </>
      ) : (
        <>
          <MapPin className="mr-2 h-4 w-4" />
          Check In at {selectedPlace.name}
        </>
      )}
    </Button>
  );
}
