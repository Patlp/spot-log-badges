
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, MapPin, AlertTriangle } from "lucide-react";
import { type Place } from "./PlacesList";
import { UseFormReturn } from "react-hook-form";
import { mapGoogleTypeToVenueType } from "@/services/places";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PlaceDetailsProps {
  selectedPlace: Place;
  form: UseFormReturn<any>;
  isSubmitting: boolean;
  onSubmit: (values: any) => void;
}

export function PlaceDetails({ 
  selectedPlace, 
  form, 
  isSubmitting,
  onSubmit
}: PlaceDetailsProps) {
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Reset local submitting state when isSubmitting changes to false
  useEffect(() => {
    if (!isSubmitting && localSubmitting) {
      console.log("External submission completed, resetting local state");
      setLocalSubmitting(false);
    }
  }, [isSubmitting, localSubmitting]);
  
  // Safety timeout to prevent UI from being stuck
  useEffect(() => {
    let timeoutId: number | undefined;
    
    if (localSubmitting) {
      timeoutId = window.setTimeout(() => {
        console.log("Submission timeout reached, resetting UI");
        if (localSubmitting) {
          setLocalSubmitting(false);
          setSubmitError("Check-in timed out. The request may still be processing or failed silently. Please check your console logs.");
          console.log("Mutation chain never resolved.");
        }
      }, 8000); // 8 second timeout
    }
    
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [localSubmitting]);
  
  const handleSubmit = (values: any) => {
    if (localSubmitting || isSubmitting) {
      console.log("Already submitting, ignoring click");
      return; // Prevent double submissions
    }
    
    // Clear any previous error
    setSubmitError(null);
    console.log("PlaceDetails: Handling form submission with values:", values);
    setLocalSubmitting(true);
    
    // Call the onSubmit function, but catch any synchronous errors
    try {
      onSubmit(values);
    } catch (error: any) {
      console.error("Synchronous error in handleSubmit:", error);
      setSubmitError(error.message || "An unexpected error occurred");
      setLocalSubmitting(false);
    }
  };

  // Use a combined submitting state to ensure UI reflects submission properly
  const combinedSubmitting = isSubmitting || localSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 border-t pt-4 mt-4">
        {submitError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
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
          disabled={combinedSubmitting}
          className="w-full"
        >
          {combinedSubmitting ? (
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
