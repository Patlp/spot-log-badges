
import { Badge } from "@/components/ui/badge";
import { mapGoogleTypeToVenueType } from "@/services/places";
import { Place } from "../PlacesList";

interface PlaceHeaderProps {
  selectedPlace: Place;
}

export function PlaceHeader({ selectedPlace }: PlaceHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h3 className="font-medium">{selectedPlace.name}</h3>
        <p className="text-sm text-muted-foreground">{selectedPlace.address}</p>
      </div>
      <Badge>{mapGoogleTypeToVenueType(selectedPlace.types)}</Badge>
    </div>
  );
}
