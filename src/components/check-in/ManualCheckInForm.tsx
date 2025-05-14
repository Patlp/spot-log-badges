
import { z } from "zod";
import { UseFormReturn } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";
import { MoodCheckIn } from "./MoodCheckIn";

// Define the form schema using zod
export const checkInSchema = z.object({
  venue_name: z.string().min(2, "Venue name is required"),
  venue_type: z.string().min(1, "Venue type is required"),
  location: z.string().min(2, "Location is required"),
  check_in_time: z.string().min(1, "Date and time are required"),
  notes: z.string().optional(),
});

export type CheckInFormValues = z.infer<typeof checkInSchema>;

interface ManualCheckInFormProps {
  form: UseFormReturn<CheckInFormValues>;
  isSubmitting: boolean;
  onSubmit: (data: CheckInFormValues) => void;
}

export function ManualCheckInForm({ form, isSubmitting, onSubmit }: ManualCheckInFormProps) {
  // Get the current value of venue_name for use in MoodCheckIn
  const venueName = form.watch("venue_name");
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Venue Name */}
        <FormField
          control={form.control}
          name="venue_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter the name of the venue" 
                  {...field} 
                />
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
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a venue type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Restaurant">Restaurant</SelectItem>
                  <SelectItem value="Bar">Bar</SelectItem>
                  <SelectItem value="Club">Club</SelectItem>
                  <SelectItem value="Cafe">Cafe</SelectItem>
                  <SelectItem value="Park">Park</SelectItem>
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
                <Input 
                  placeholder="Address or general area" 
                  {...field} 
                />
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

        {/* Submit Button */}
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
        
        {/* Add the MoodCheckIn component if a venue name is provided */}
        {venueName && venueName.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <MoodCheckIn venueName={venueName} />
          </div>
        )}
      </form>
    </Form>
  );
}
