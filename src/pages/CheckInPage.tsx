
import { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Import components
import { LocationControl } from "@/components/check-in/LocationControl";
import { ManualCheckInForm, checkInSchema, CheckInFormValues } from "@/components/check-in/ManualCheckInForm";
import { useCheckIn } from "@/hooks/use-check-in";
import { useNearbyPlaces } from "@/hooks/use-nearby-places";
import { TestCheckInButton } from "@/components/check-in/TestCheckInButton";
import { CheckInHeader } from "@/components/check-in/CheckInHeader";
import { CheckInTabs } from "@/components/check-in/CheckInTabs";
import { NearbyPlacesTab } from "@/components/check-in/NearbyPlacesTab";
import { Place } from "@/components/check-in/PlacesList";

const CheckInPage = () => {
  const { user } = useContext(AuthContext);
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
  
  const { checkIn, isSubmitting } = useCheckIn();

  console.log("[CheckInPage] Render state:", { 
    user: !!user, 
    isSubmitting,
    activeTab, 
    hasSelectedPlace: !!selectedPlace,
    formValues: form.getValues(),
    nearbyPlacesCount: nearbyPlaces.length
  });

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
    
    // Validate required fields
    if (!data.venue_name || !data.venue_type || !data.location || !data.check_in_time) {
      console.error("[CheckInPage] Missing required check-in fields:", data);
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before checking in.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    
    try {
      // Prepare check-in data and submit
      const checkInData = {
        user_id: user.id,
        venue_name: data.venue_name,
        venue_type: data.venue_type,
        location: data.location,
        check_in_time: data.check_in_time,
        notes: data.notes || null
      };
      
      console.log("[CheckInPage] Submitting with data:", checkInData);
      checkIn(checkInData);
    } catch (error: any) {
      console.error("[CheckInPage] Synchronous error during check-in:", error);
      
      toast({
        title: "Check-in Failed",
        description: "There was an error processing your check-in. Please try again.",
        duration: 5000,
      });
    }
  }, [user, checkIn]);

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

      {/* Test Check-In Button */}
      <TestCheckInButton userId={user?.id} />

      <CheckInHeader>
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
        <CheckInTabs
          nearbyPlaces={nearbyPlaces}
          isLoadingPlaces={isLoadingPlaces}
          useLocation={useLocation}
          onTabChange={setActiveTab}
          manualTabContent={
            <ManualCheckInForm 
              form={form} 
              isSubmitting={isSubmitting} 
              onSubmit={onSubmit}
            />
          }
          nearbyTabContent={
            <NearbyPlacesTab
              nearbyPlaces={nearbyPlaces}
              isLoadingPlaces={isLoadingPlaces}
              selectedPlace={selectedPlace}
              setSelectedPlace={setSelectedPlace}
              form={form}
              isSubmitting={isSubmitting}
              onSubmit={onSubmit}
              onRetryFetch={handleRetryFetchPlaces}
              onSwitchToManual={handleSwitchToManual}
            />
          }
        />
      </CheckInHeader>
    </div>
  );
};

export default CheckInPage;
