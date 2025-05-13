
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { LocateFixed, Building, MapPin } from "lucide-react";
import { mapGoogleTypeToVenueType } from "@/services/places";

export type Place = {
  name: string;
  address: string;
  place_id: string;
  types: string[];
  latitude: number;
  longitude: number;
  distance?: number;
};

interface PlacesListProps {
  places: Place[];
  isLoading: boolean;
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  onRetryFetch: () => void;
  onSwitchToManual: () => void;
}

export function PlacesList({ 
  places, 
  isLoading, 
  selectedPlace, 
  onSelectPlace,
  onRetryFetch,
  onSwitchToManual
}: PlacesListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  
  if (places.length === 0) {
    return (
      <Alert>
        <AlertTitle>No places found</AlertTitle>
        <AlertDescription>
          <p>No places found nearby. Try these options:</p>
          <div className="flex gap-2 mt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRetryFetch}
            >
              <LocateFixed className="mr-2 h-3 w-3" />
              Retry
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onSwitchToManual}
            >
              <Building className="mr-2 h-3 w-3" />
              Manual Entry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-2 max-h-64 overflow-y-auto">
      {places.map((place) => (
        <Card 
          key={place.place_id}
          className={`cursor-pointer p-3 transition ${selectedPlace?.place_id === place.place_id ? 'border-2 border-primary ring-1 ring-primary' : 'hover:border-primary/50'}`}
          onClick={() => onSelectPlace(place)}
        >
          <div className="flex justify-between">
            <div>
              <h4 className="font-medium">{place.name}</h4>
              <p className="text-sm text-muted-foreground">{place.address}</p>
              {place.distance !== undefined && (
                <p className="text-xs text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {place.distance < 1000 
                    ? `${Math.round(place.distance)}m away` 
                    : `${(place.distance / 1000).toFixed(1)}km away`}
                </p>
              )}
            </div>
            <Badge>{mapGoogleTypeToVenueType(place.types)}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}
