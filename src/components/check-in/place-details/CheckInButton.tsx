
// DO NOT MODIFY THIS FILE — This component is part of the working check-in system. 
// Any changes may break the Nearby, Manual, or Test check-in workflows.

import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Place } from "../PlacesList";

interface CheckInButtonProps {
  isFormSubmitting: boolean;
  selectedPlace: Place;
}

export function CheckInButton({ isFormSubmitting, selectedPlace }: CheckInButtonProps) {
  return (
    <Button
      type="button" // Changed from submit to button to prevent form submission
      disabled={true} // Always disabled to prevent check-ins
      className="w-full"
    >
      <MapPin className="mr-2 h-4 w-4" />
      Check In Disabled
    </Button>
  );
}
