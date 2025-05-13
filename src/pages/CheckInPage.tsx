
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import components
import { LocationControl } from "@/components/check-in/LocationControl";
import { PlacesList, Place } from "@/components/check-in/PlacesList";
import { PlaceDetails } from "@/components/check-in/PlaceDetails";
import { ManualCheckInForm, checkInSchema, CheckInFormValues } from "@/components/check-in/ManualCheckInForm";
import { useCheckIn } from "@/hooks/use-check-in";
import { useNearbyPlaces } from "@/hooks/use-nearby-places";

const CheckInPage = () => {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // States for UI
  const [activeTab, setActiveTab] = useState<string>("manual");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  
  // Get current date/time in ISO format for the default value
  const currentDateTime = new Date().toISOString().slice(0, 16);
  
  // Set up the form with react-hook-form and zod validation
  const form = useForm<CheckInFormValues>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      venue_name: "",
      venue_type: "Restaurant",
      location: "",
      check_in_time: currentDateTime,
      notes: "",
    },
  });
  
  // Use our custom hooks for places and check-in
  const { 
    useLocation, 
    isLoadingPlaces, 
    nearbyPlaces, 
    locationCoords,
    locationError,
    handleLocationFound,
    handleLocationError, 
    handleLoadingChange,
    handleToggleLocation,
    fetchNearbyPlaces 
  } = useNearbyPlaces();
  
  const { isSubmitting, handleCheckIn } = useCheckIn({ 
    onSuccess: () => navigate("/") 
  });

  // Update form when a place is selected
  useEffect(() => {
    if (selectedPlace) {
      form.setValue("venue_name", selectedPlace.name);
      form.setValue("location", selectedPlace.address);
      form.setValue("venue_type", selectedPlace.types.some(t => t === 'restaurant' || t === 'food') 
        ? "Restaurant" 
        : selectedPlace.types.some(t => t === 'bar') 
          ? "Bar" 
          : selectedPlace.types.some(t => t === 'night_club') 
            ? "Club" 
            : "Other"
      );
    }
  }, [selectedPlace, form]);
  
  // Force a retry of location and place fetching
  const handleRetryFetchPlaces = async () => {
    if (locationCoords) {
      fetchNearbyPlaces(locationCoords.lat, locationCoords.lng);
    } else {
      handleToggleLocation();
    }
  };

  // Switch to manual entry tab
  const handleSwitchToManual = () => {
    setActiveTab("manual");
  };

  // Submit handler for the form
  const onSubmit = (data: CheckInFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to check in.",
        variant: "destructive",
      });
      return;
    }
    
    handleCheckIn(data, user.id, selectedPlace);
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Check In</h1>

      <Card>
        <CardHeader>
          <CardTitle>Where are you now?</CardTitle>
          <CardDescription>
            Log your visit and earn badges for the places you go
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Location Control Component */}
          <LocationControl 
            useLocation={useLocation}
            isLoadingPlaces={isLoadingPlaces}
            onToggleLocation={handleToggleLocation}
            onLocationFound={handleLocationFound}
            onLocationError={handleLocationError}
            onLoadingChange={handleLoadingChange}
            onRetryFetch={handleRetryFetchPlaces}
          />

          {/* Tabs for Manual or Nearby Places */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">
                <Building className="h-4 w-4 mr-2" />
                Manual Entry
              </TabsTrigger>
              <TabsTrigger 
                value="nearby" 
                disabled={isLoadingPlaces || (nearbyPlaces.length === 0 && useLocation && !isLoadingPlaces)}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {nearbyPlaces.length > 0 
                  ? `Nearby Places (${nearbyPlaces.length})` 
                  : 'Nearby Places'}
              </TabsTrigger>
            </TabsList>

            {/* Manual Entry Tab */}
            <TabsContent value="manual" className="pt-4">
              <ManualCheckInForm 
                form={form} 
                isSubmitting={isSubmitting} 
                onSubmit={onSubmit}
              />
            </TabsContent>

            {/* Nearby Places Tab */}
            <TabsContent value="nearby" className="pt-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-3">Select a place to check in</h3>
                
                <PlacesList 
                  places={nearbyPlaces}
                  isLoading={isLoadingPlaces}
                  selectedPlace={selectedPlace}
                  onSelectPlace={setSelectedPlace}
                  onRetryFetch={handleRetryFetchPlaces}
                  onSwitchToManual={handleSwitchToManual}
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckInPage;
