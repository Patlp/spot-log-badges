
import { VenueType } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, MapPin } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

// Define the form validation schema using zod
export const checkInSchema = z.object({
  venue_name: z.string().min(2, { message: "Venue name must be at least 2 characters" }),
  venue_type: z.enum(["Bar", "Restaurant", "Club", "Event", "Other"]),
  location: z.string().min(2, { message: "Location must be at least 2 characters" }),
  check_in_time: z.string(),
  notes: z.string().optional(),
});

export type CheckInFormValues = z.infer<typeof checkInSchema>;

interface ManualCheckInFormProps {
  form: UseFormReturn<CheckInFormValues>;
  isSubmitting: boolean;
  onSubmit: (data: CheckInFormValues) => void;
}

export function ManualCheckInForm({ 
  form, 
  isSubmitting, 
  onSubmit
}: ManualCheckInFormProps) {
  console.log("[ManualCheckInForm] Render with isSubmitting:", isSubmitting);
  
  const handleSubmit = (values: CheckInFormValues) => {
    console.log("[ManualCheckInForm] Form submit with values:", values);
    onSubmit(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Venue Name */}
        <FormField
          control={form.control}
          name="venue_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Cloudtop Bar" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Venue Type */}
        <FormField
          control={form.control}
          name="venue_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Restaurant">Restaurant</SelectItem>
                  <SelectItem value="Bar">Bar</SelectItem>
                  <SelectItem value="Club">Club</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g. New York, NY" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
              Checking In...
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Check In
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
