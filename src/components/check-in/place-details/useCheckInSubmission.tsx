
import { useState, useContext } from "react";
import { useCheckInEngine } from "@/lib/checkinEngine";
import { AuthContext } from "../../../App";
import { toast } from "@/hooks/use-toast";
import { mapGoogleTypeToVenueType } from "@/services/places";
import { Place } from "../PlacesList";

export function useCheckInSubmission(selectedPlace: Place) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<string | null>(null);
  const { user } = useContext(AuthContext);
  
  // Use our check-in engine with debug mode enabled but handle navigation manually
  const { checkIn, isSubmitting: engineIsSubmitting } = useCheckInEngine({ 
    debugMode: true,
    enableRedirect: false,
    enableToasts: false
  });

  // Display diagnostic info for 5 seconds
  const showDiagnostic = (message: string) => {
    console.log("[PlaceDetails] Diagnostic:", message);
    setDiagnosticInfo(message);
    
    setTimeout(() => {
      setDiagnosticInfo(null);
    }, 5000);
  };

  const handleSubmit = async (values: any) => {
    // Clear previous errors and show diagnostic
    setSubmitError(null);
    showDiagnostic("Starting check-in submission");
    
    // First diagnostic toast to confirm function is firing
    toast({
      title: "Nearby Check-in triggered",
      description: "Starting check-in process",
      variant: "default"
    });
    
    try {
      console.log("[PlaceDetails] Submitting form with values:", values);
      
      if (!user) {
        const error = "Authentication required to check in";
        setSubmitError(error);
        showDiagnostic(`Error: ${error}`);
        return;
      }
      
      // Ensure we're passing all the required fields
      const checkInData = {
        user_id: user.id,
        venue_name: values.venue_name || selectedPlace.name,
        venue_type: values.venue_type || mapGoogleTypeToVenueType(selectedPlace.types),
        location: values.location || selectedPlace.address,
        check_in_time: values.check_in_time,
        notes: values.notes
      };
      
      console.log("[PlaceDetails] Prepared check-in data:", checkInData);
      showDiagnostic("Submitting check-in via engine");
      
      // Use our check-in engine
      const result = await checkIn(checkInData);
      
      console.log("[PlaceDetails] Check-in result:", result);
      
      if (result.success) {
        showDiagnostic(`Check-in successful! Badge awarded: ${result.badgeAwarded}`);
        
        // Second diagnostic toast to confirm success
        toast({
          title: "Check-in complete!",
          description: `Successfully checked in at ${checkInData.venue_name}`,
          variant: "default"
        });
        
        // DO NOT MODIFY — final working redirect logic for nearby check-ins
        // Use a short timeout before navigating to ensure toast is visible
        setTimeout(() => {
          console.log("[PlaceDetails] Forcing page redirect after successful check-in");
          // Force a full page reload/redirect that bypasses React Router
          window.location.assign("/profile");
        }, 500);
      } else {
        setSubmitError(result.error?.message || "Check-in failed");
        showDiagnostic(`Error: ${result.error?.message || "Unknown error"}`);
      }
      
    } catch (error: any) {
      console.error("[PlaceDetails] Error during submit:", error);
      setSubmitError(error.message || "An unexpected error occurred");
      showDiagnostic(`Exception: ${error.message}`);
    } finally {
      // Make sure we always reset the submitting state
      console.log("[PlaceDetails] Resetting submitting state in finally block");
      // We don't call setIsFormSubmitting(false) here because the page will reload
      // and resetting the state before navigation could cause UI flicker
    }
  };

  return {
    submitError,
    diagnosticInfo,
    engineIsSubmitting,
    showDiagnostic,
    handleSubmit
  };
}
