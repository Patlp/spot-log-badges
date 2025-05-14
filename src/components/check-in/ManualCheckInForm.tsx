
import { VenueType } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, MapPin } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../App";
import { toast } from "@/hooks/use-toast";
import { useCheckInEngine } from "@/lib/checkinEngine";

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
  isSubmitting: parentIsSubmitting, 
  onSubmit: parentOnSubmit
}: ManualCheckInFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Use check-in engine
  const { checkIn } = useCheckInEngine({ 
    debugMode: true,
    enableRedirect: false,
    enableToasts: true
  });

  const handleManualCheckIn = async (values: CheckInFormValues) => {
    // Prevent check-in if already submitting
    if (isSubmitting || parentIsSubmitting) {
      return;
    }

    console.log("[ManualCheckInForm] Starting check-in with values:", values);
    
    try {
      // Validate user is logged in
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to check in",
          variant: "destructive"
        });
        return;
      }
      
      // Set loading state
      setIsSubmitting(true);
      
      // Prepare check-in data
      const checkInData = {
        user_id: user.id,
        venue_name: values.venue_name,
        venue_type: values.venue_type,
        location: values.location,
        check_in_time: values.check_in_time,
        notes: values.notes
      };
      
      // Show initial toast
      toast({
        title: "Checking in...",
        description: `Processing check-in at ${values.venue_name}`,
        variant: "default"
      });
      
      // Execute check-in
      const result = await checkIn(checkInData);
      
      console.log("[ManualCheckInForm] Check-in result:", result);
      
      if (result.success) {
        // Show success toast
        toast({
          title: "Check-in Complete!",
          description: `Successfully checked in at ${values.venue_name}`,
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
      console.error("[ManualCheckInForm] Error during check-in:", error);
      toast({
        title: "Check-in Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isButtonSubmitting = isSubmitting || parentIsSubmitting;
  
  console.log("[ManualCheckInForm] Render with isSubmitting:", isButtonSubmitting);
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleManualCheckIn)} className="space-y-4">
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
          disabled={isButtonSubmitting}
          className="w-full"
        >
          {isButtonSubmitting ? (
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
