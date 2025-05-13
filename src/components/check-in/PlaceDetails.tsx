
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, MapPin } from "lucide-react";
import { type Place } from "./PlacesList";
import { UseFormReturn } from "react-hook-form";
import { mapGoogleTypeToVenueType } from "@/services/places";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Reset local submitting state when isSubmitting changes to false
  useEffect(() => {
    if (!isSubmitting && localSubmitting) {
      console.log("External submission completed, resetting local state");
      setLocalSubmitting(false);
    }
  }, [isSubmitting, localSubmitting]);
  
  const handleSubmit = (values: any) => {
    if (localSubmitting || isSubmitting) {
      console.log("Already submitting, ignoring click");
      return; // Prevent double submissions
    }
    
    console.log("PlaceDetails: Handling form submission with values:", values);
    setLocalSubmitting(true);
    
    try {
      console.log("PlaceDetails: Calling onSubmit");
      onSubmit(values);
      
      // If submission hasn't set isSubmitting to true within 500ms, something might be wrong
      setTimeout(() => {
        if (localSubmitting && !isSubmitting) {
          console.log("Submission did not start properly, showing error toast");
          setLocalSubmitting(false);
          toast({
            title: "Check-in Issue",
            description: "There was a problem processing your check-in. Please try again.",
            variant: "destructive"
          });
        }
      }, 500);
      
    } catch (error) {
      console.error("Error in check-in submission:", error);
      setLocalSubmitting(false);
      toast({
        title: "Check-in Failed",
        description: "There was a problem processing your check-in. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Use a combined submitting state to ensure UI reflects submission properly
  const combinedSubmitting = isSubmitting || localSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 border-t pt-4 mt-4">
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
