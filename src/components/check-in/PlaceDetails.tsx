
import { useState } from "react";
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
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = (values: any) => {
    // Clear any previous error
    setSubmitError(null);
    console.log("[PlaceDetails] Submitting form with values:", values);
    
    try {
      // Ensure we're passing all the required fields
      const checkInData = {
        ...values,
        // Make sure these fields are explicitly set
        venue_name: values.venue_name || selectedPlace.name,
        location: values.location || selectedPlace.address,
        venue_type: values.venue_type || mapGoogleTypeToVenueType(selectedPlace.types)
      };
      
      console.log("[PlaceDetails] Enhanced check-in data:", checkInData);
      onSubmit(checkInData);
    } catch (error: any) {
      console.error("[PlaceDetails] Synchronous error during submit:", error);
      setSubmitError(error.message || "An unexpected error occurred");
    }
  };

  console.log("[PlaceDetails] Render with isSubmitting:", isSubmitting);

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
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
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
