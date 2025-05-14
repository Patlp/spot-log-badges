
// DO NOT MODIFY – working check-in implementation
// This is a locked implementation of the check-in functionality to prevent regressions
// It works with the central check-in engine and handles all required visual feedback

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, MapPin, AlertTriangle } from "lucide-react";
import { mapGoogleTypeToVenueType } from "@/services/places";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCheckInEngine } from "@/lib/checkinEngine";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../App";
import { useContext } from "react";
import { toast } from "@/hooks/use-toast";
import { type Place } from "../check-in/PlacesList";
import { UseFormReturn } from "react-hook-form";

interface PlaceDetailsProps {
  selectedPlace: Place;
  form: UseFormReturn<any>;
  isSubmitting: boolean;
  onSubmit: (values: any) => void;
}

export function SafePlaceDetails({ 
  selectedPlace, 
  form, 
  isSubmitting: parentIsSubmitting,
  onSubmit: parentOnSubmit
}: PlaceDetailsProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<string | null>(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Use our check-in engine with debug mode enabled but handle navigation manually
  const { checkIn, isSubmitting: engineIsSubmitting } = useCheckInEngine({ 
    debugMode: true,
    enableRedirect: false,
    enableToasts: false
  });

  // Display diagnostic info for 5 seconds
  const showDiagnostic = (message: string) => {
    console.log("[SafePlaceDetails] Diagnostic:", message);
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
      console.log("[SafePlaceDetails] Submitting form with values:", values);
      
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
      
      console.log("[SafePlaceDetails] Prepared check-in data:", checkInData);
      showDiagnostic("Submitting check-in via engine");
      
      // Use our check-in engine
      const result = await checkIn(checkInData);
      
      console.log("[SafePlaceDetails] Check-in result:", result);
      
      if (result.success) {
        showDiagnostic(`Check-in successful! Badge awarded: ${result.badgeAwarded}`);
        
        // Second diagnostic toast to confirm success
        toast({
          title: "Check-in complete!",
          description: `Successfully checked in at ${checkInData.venue_name}`,
          variant: "default"
        });
        
        // Use a short timeout before navigating to ensure toast is visible
        setTimeout(() => {
          console.log("[SafePlaceDetails] Navigating to profile after successful check-in");
          
          // Use regular navigation, but if that fails, we'll fallback to direct location change
          try {
            navigate("/profile");
          } catch (navError) {
            console.error("[SafePlaceDetails] Navigation error, using fallback:", navError);
            window.location.href = "/profile";
          }
        }, 500);
      } else {
        setSubmitError(result.error?.message || "Check-in failed");
        showDiagnostic(`Error: ${result.error?.message || "Unknown error"}`);
      }
      
    } catch (error: any) {
      console.error("[SafePlaceDetails] Error during submit:", error);
      setSubmitError(error.message || "An unexpected error occurred");
      showDiagnostic(`Exception: ${error.message}`);
    }
  };

  // For logging purposes, show when component renders with what state
  useEffect(() => {
    console.log("[SafePlaceDetails] Render with states:", { 
      parentIsSubmitting, 
      engineIsSubmitting, 
      selectedPlace: selectedPlace.name
    });
  }, [parentIsSubmitting, engineIsSubmitting, selectedPlace]);

  const isFormSubmitting = parentIsSubmitting || engineIsSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 border-t pt-4 mt-4">
        {submitError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
        
        {diagnosticInfo && (
          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-700">
              Diagnostic: {diagnosticInfo}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">{selectedPlace.name}</h3>
            <p className="text-sm text-muted-foreground">{selectedPlace.address}</p>
          </div>
          <Badge>{mapGoogleTypeToVenueType(selectedPlace.types)}</Badge>
        </div>

        {/* Date/Time */}
        <FormField
          control={form.control}
          name="check_in_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date & Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="How was it? Add any thoughts or vibes here..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isFormSubmitting}
          className="w-full"
        >
          {isFormSubmitting ? (
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
      </form>
    </Form>
  );
}
