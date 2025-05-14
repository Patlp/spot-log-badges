
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { MoodCheckIn } from "./MoodCheckIn";
import { CheckInFormValues } from "./ManualCheckInForm";
import { Place } from "./PlacesList";
import { mapGoogleTypeToVenueType } from "@/services/places";
import { DiagnosticAlerts } from "./place-details/DiagnosticAlerts";
import { PlaceHeader } from "./place-details/PlaceHeader";
import { useCheckInSubmission } from "./place-details/useCheckInSubmission";

interface PlaceDetailsProps {
  selectedPlace: Place;
  form: UseFormReturn<CheckInFormValues>;
  isSubmitting: boolean;
  onSubmit: (values: any) => void;
}

export function PlaceDetails({ selectedPlace, form, isSubmitting, onSubmit }: PlaceDetailsProps) {
  const { 
    submitError, 
    diagnosticInfo, 
    handleSubmit 
  } = useCheckInSubmission({ 
    selectedPlace, 
    form, 
    onSubmit 
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 border-t pt-4 mt-4">
        <DiagnosticAlerts
          submitError={submitError}
          diagnosticInfo={diagnosticInfo}
        />

        <PlaceHeader 
          selectedPlace={selectedPlace}
        />

        {/* Date/Time hidden but kept for compatibility */}
        <div className="hidden">
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
        </div>

        {/* Notes hidden but kept for compatibility */}
        <div className="hidden">
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
        </div>

        {/* MoodCheckIn is now the primary interaction */}
        <MoodCheckIn venueName={selectedPlace.name} />
      </form>
    </Form>
  );
}
