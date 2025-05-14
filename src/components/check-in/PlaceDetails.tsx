
import { useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { type Place } from "./PlacesList";
import { UseFormReturn } from "react-hook-form";

// Import the new components
import { DiagnosticAlerts } from "./place-details/DiagnosticAlerts";
import { PlaceHeader } from "./place-details/PlaceHeader";
import { CheckInButton } from "./place-details/CheckInButton";
import { useCheckInSubmission } from "./place-details/useCheckInSubmission";

interface PlaceDetailsProps {
  selectedPlace: Place;
  form: UseFormReturn<any>;
  isSubmitting: boolean;
  onSubmit: (values: any) => void;
}

export function PlaceDetails({ 
  selectedPlace, 
  form, 
  isSubmitting: parentIsSubmitting,
  onSubmit: parentOnSubmit
}: PlaceDetailsProps) {
  const {
    submitError,
    diagnosticInfo,
    engineIsSubmitting,
    handleSubmit
  } = useCheckInSubmission(selectedPlace);

  // For logging purposes, show when component renders with what state
  useEffect(() => {
    console.log("[PlaceDetails] Render with states:", { 
      parentIsSubmitting, 
      engineIsSubmitting, 
      selectedPlace: selectedPlace.name
    });
  }, [parentIsSubmitting, engineIsSubmitting, selectedPlace]);

  const isFormSubmitting = parentIsSubmitting || engineIsSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 border-t pt-4 mt-4">
        <DiagnosticAlerts 
          submitError={submitError} 
          diagnosticInfo={diagnosticInfo} 
        />

        <PlaceHeader selectedPlace={selectedPlace} />

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

        <CheckInButton 
          isFormSubmitting={isFormSubmitting} 
          selectedPlace={selectedPlace} 
        />
      </form>
    </Form>
  );
}
