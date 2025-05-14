
import { Place, PlacesList } from "./PlacesList";
import { PlaceDetails } from "./PlaceDetails";
import { UseFormReturn } from "react-hook-form";
import { CheckInFormValues } from "./ManualCheckInForm";

interface NearbyPlacesTabProps {
  nearbyPlaces: Place[];
  isLoadingPlaces: boolean;
  selectedPlace: Place | null;
  setSelectedPlace: (place: Place | null) => void;
  form: UseFormReturn<CheckInFormValues>;
  isSubmitting: boolean;
  onSubmit: (data: CheckInFormValues) => void;
  onRetryFetch: () => void;
  onSwitchToManual: () => void;
}

export function NearbyPlacesTab({
  nearbyPlaces,
  isLoadingPlaces,
  selectedPlace,
  setSelectedPlace,
  form,
  isSubmitting,
  onSubmit,
  onRetryFetch,
  onSwitchToManual
}: NearbyPlacesTabProps) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-3">Select a place to check in</h3>
        
        <PlacesList 
          places={nearbyPlaces}
          isLoading={isLoadingPlaces}
          selectedPlace={selectedPlace}
          onSelectPlace={setSelectedPlace}
          onRetryFetch={onRetryFetch}
          onSwitchToManual={onSwitchToManual}
        />
      </div>

      {selectedPlace && (
        <PlaceDetails
          selectedPlace={selectedPlace}
          form={form}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
        />
      )}
      
      {!selectedPlace && !isLoadingPlaces && nearbyPlaces.length > 0 && (
        <div className="text-center text-muted-foreground">
          Please select a place from the list above to check in
        </div>
      )}
    </div>
  );
}
