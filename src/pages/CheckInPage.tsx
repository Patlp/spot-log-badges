
import { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// Import components
import { LocationControl } from "@/components/check-in/LocationControl";
import { PlacesList, Place } from "@/components/check-in/PlacesList";
import { PlaceDetails } from "@/components/check-in/PlaceDetails";
import { ManualCheckInForm, checkInSchema, CheckInFormValues } from "@/components/check-in/ManualCheckInForm";
import { useCheckIn } from "@/hooks/use-check-in";
import { useNearbyPlaces } from "@/hooks/use-nearby-places";

const CheckInPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // States for UI
  const [activeTab, setActiveTab] = useState<string>("manual");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  
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
  
  console.log("[CheckInPage] Form default values set:", form.getValues());
  
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
  
  const { checkIn } = useCheckIn();

  console.log("[CheckInPage] Render state:", { 
    user: !!user, 
    isSubmitting: isFormSubmitting, 
    activeTab, 
    hasSelectedPlace: !!selectedPlace,
    formValues: form.getValues(),
    nearbyPlacesCount: nearbyPlaces.length
  });

  // Function to handle the test check-in
  const handleTestCheckIn = () => {
    console.log("[CheckInPage] Testing check-in with sample data");
    
    // Use actual user ID if available, otherwise use a test ID
    const testUserId = user?.id || "test-user-id";
    
    checkIn({ 
      venue_name: "Test Place",
      venue_type: "Restaurant", 
      location: "Test Location",
      check_in_time: new Date().toISOString(),
      user_id: testUserId 
    });
  };

  // Update form when a place is selected
  useEffect(() => {
    if (selectedPlace) {
      console.log("[CheckInPage] Selected place changed, updating form:", selectedPlace);
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
  const handleRetryFetchPlaces = useCallback(async () => {
    console.log("[CheckInPage] Retrying fetch places");
    if (locationCoords) {
      fetchNearbyPlaces(locationCoords.lat, locationCoords.lng);
    } else {
      handleToggleLocation();
    }
  }, [locationCoords, fetchNearbyPlaces, handleToggleLocation]);

  // Switch to manual entry tab
  const handleSwitchToManual = useCallback(() => {
    console.log("[CheckInPage] Switching to manual entry tab");
    setActiveTab("manual");
  }, []);

  // Submit handler for the form
  const onSubmit = useCallback((data: CheckInFormValues) => {
    console.log("[CheckInPage] Submitting check-in data:", data);
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to check in.",
        duration: 5000,
      });
      return;
    }
    
    try {
      setIsFormSubmitting(true);
      
      // Directly use checkIn to submit the data
      const checkInData = {
        user_id: user.id,
        venue_name: data.venue_name,
        venue_type: data.venue_type,
        location: data.location,
        check_in_time: data.check_in_time,
        notes: data.notes || null
      };
      
      console.log("[CheckInPage] Submitting with data:", checkInData);
      
      checkIn(checkInData)
        .then(() => {
          // Only show success toast if no alert shown from checkIn
          toast({
            title: "Check-in Successful!",
            description: `You checked in at ${data.venue_name}`,
            duration: 5000,
          });
          
          // Navigate after a short delay
          setTimeout(() => navigate('/profile'), 1000);
        })
        .catch((error: any) => {
          console.error("[CheckInPage] Error during check-in:", error);
          toast({
            title: "Check-in Failed",
            description: error.message || "There was a problem with your check-in",
            variant: "destructive",
            duration: 5000,
          });
        })
        .finally(() => {
          setIsFormSubmitting(false);
        });
    } catch (error: any) {
      console.error("[CheckInPage] Synchronous error during check-in:", error);
      setIsFormSubmitting(false);
      
      toast({
        title: "Check-in Failed",
        description: "There was an error processing your check-in. Please try again.",
        duration: 5000,
      });
    }
  }, [user, checkIn, navigate]);

  // Verify user authentication
  useEffect(() => {
    if (!user) {
      console.log("[CheckInPage] No authenticated user, showing toast");
      toast({
        title: "Authentication Required",
        description: "You must be logged in to check in.",
        duration: 5000,
      });
      // Optional: redirect to login page after a delay
      // setTimeout(() => navigate('/auth'), 3000);
    }
  }, [user, navigate]);

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Check In</h1>

      {/* Add Test Button */}
      <Button 
        onClick={handleTestCheckIn} 
        variant="outline" 
        className="mb-4 w-full"
      >
        Test Check-In Function
      </Button>

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
                isSubmitting={isFormSubmitting} 
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
                  isSubmitting={isFormSubmitting}
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
