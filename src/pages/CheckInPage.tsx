
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { supabase, createCheckIn, VenueType } from "../lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getNearbyPlaces } from "@/services/places";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, MapPin } from "lucide-react";

// Import our refactored components
import { LocationControl } from "@/components/check-in/LocationControl";
import { PlacesList, Place } from "@/components/check-in/PlacesList";
import { PlaceDetails } from "@/components/check-in/PlaceDetails";
import { ManualCheckInForm, checkInSchema, CheckInFormValues } from "@/components/check-in/ManualCheckInForm";

const CheckInPage = () => {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [useLocation, setUseLocation] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [activeTab, setActiveTab] = useState<string>("manual");
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

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

  // Handle when location is found
  const handleLocationFound = async (latitude: number, longitude: number) => {
    setLocationCoords({lat: latitude, lng: longitude});
    setLocationError(null);
    
    if (useLocation) {
      fetchNearbyPlaces(latitude, longitude);
    }
  };

  // Handle location errors
  const handleLocationError = (error: string) => {
    setLocationError(error);
    console.error("Location error:", error);
  };

  // Handle location loading state changes
  const handleLoadingChange = (isLoading: boolean) => {
    setIsLoadingPlaces(isLoading);
  };

  // Fetch nearby places function
  const fetchNearbyPlaces = async (latitude: number, longitude: number) => {
    if (!latitude || !longitude) return;
    
    setIsLoadingPlaces(true);
    try {
      console.log("Fetching places at coordinates:", latitude, longitude);
      const places = await getNearbyPlaces(latitude, longitude);
      console.log("Fetched places:", places);
      setNearbyPlaces(places);
      
      // If we successfully got places, switch to the nearby tab
      if (places.length > 0) {
        setActiveTab("nearby");
        toast({
          title: "Places found!",
          description: `Found ${places.length} places near you.`,
        });
      } else {
        toast({
          title: "No places found nearby",
          description: "Try expanding your search area or manually enter venue details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching places:", error);
      toast({
        title: "Error fetching nearby places",
        description: "There was a problem finding venues near you. Please try again or enter venue details manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  // Toggle location usage and fetch places
  const handleToggleLocation = () => {
    setUseLocation(prev => !prev);
    
    // If turning location on and we already have coordinates, fetch places
    if (!useLocation && locationCoords) {
      fetchNearbyPlaces(locationCoords.lat, locationCoords.lng);
    }
  };

  // Select a place from the nearby places list
  const handleSelectPlace = (place: Place) => {
    setSelectedPlace(place);
  };

  // Force a retry of location and place fetching
  const handleRetryFetchPlaces = async () => {
    if (locationCoords) {
      fetchNearbyPlaces(locationCoords.lat, locationCoords.lng);
    } else {
      setUseLocation(true);
    }
  };

  // Switch to manual entry tab
  const handleSwitchToManual = () => {
    setActiveTab("manual");
  };

  // Mutation for check-in submission
  const checkInMutation = useMutation({
    mutationFn: async (data: CheckInFormValues) => {
      if (!user) throw new Error("You must be logged in to check in");
      
      setIsSubmitting(true);
      
      try {
        // Create the check-in
        const checkInData = {
          user_id: user.id,
          venue_name: data.venue_name,
          venue_type: data.venue_type as VenueType,
          location: data.location,
          check_in_time: data.check_in_time,
          notes: data.notes || "",
        };
        
        if (selectedPlace) {
          // Store the venue in our venues table for future reference
          try {
            const { error: venueError } = await supabase.from("venues").upsert({
              place_id: selectedPlace.place_id,
              name: selectedPlace.name,
              address: selectedPlace.address,
              types: selectedPlace.types,
              latitude: selectedPlace.latitude,
              longitude: selectedPlace.longitude,
            }, {
              onConflict: "place_id"
            });
            
            if (venueError) console.error("Error storing venue:", venueError);
          } catch (venueError) {
            console.error("Venue storage error:", venueError);
            // Continue with check-in even if venue storage fails
          }
        }
        
        await createCheckIn(checkInData);
        
        // Check if it's a first visit to this venue
        const { data: existingCheckins, error: checkError } = await supabase
          .from("check_ins")
          .select("id")
          .eq("user_id", user.id)
          .eq("venue_name", data.venue_name)
          .order("created_at", { ascending: true });
          
        if (checkError) throw checkError;
        
        // Determine which badge to award
        let badgeType = "";
        let badgeIcon = "";
        
        if (existingCheckins.length === 1) {
          // First time at this venue
          badgeType = "first_visit";
          badgeIcon = "map-pin";
        } else if (existingCheckins.length === 5) {
          // Fifth visit earns Regular badge
          badgeType = "regular";
          badgeIcon = "star";
        }
        
        // Award a badge if applicable
        if (badgeType) {
          const { error: badgeError } = await supabase
            .from("badges")
            .insert([
              {
                user_id: user.id,
                venue_name: data.venue_name,
                badge_type: badgeType,
                earned_at: new Date().toISOString(),
                icon: badgeIcon,
              },
            ]);
            
          if (badgeError) throw badgeError;
          
          // Update the profile stats
          const { data: profileData } = await supabase
            .from("profiles")
            .select("total_check_ins, total_badges, unique_venues")
            .eq("id", user.id)
            .single();
            
          if (profileData) {
            await supabase
              .from("profiles")
              .update({
                total_check_ins: profileData.total_check_ins + 1,
                total_badges: badgeType ? profileData.total_badges + 1 : profileData.total_badges,
                unique_venues: existingCheckins.length === 1 ? profileData.unique_venues + 1 : profileData.unique_venues,
              })
              .eq("id", user.id);
          }
          
          return { badgeEarned: badgeType };
        } else {
          // Just update check-in count if no badge earned
          const { data: profileData } = await supabase
            .from("profiles")
            .select("total_check_ins")
            .eq("id", user.id)
            .single();
            
          if (profileData) {
            await supabase
              .from("profiles")
              .update({
                total_check_ins: profileData.total_check_ins + 1,
              })
              .eq("id", user.id);
          }
          
          return { badgeEarned: null };
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: (data) => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["checkIns"] });
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      queryClient.invalidateQueries({ queryKey: ["allCheckIns"] });
      
      if (data.badgeEarned) {
        toast({
          title: "Badge Earned! 🏆",
          description: `You've earned a ${data.badgeEarned.replace('_', ' ')} badge for ${form.getValues("venue_name")}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Check-in Successful!",
          description: `You've checked in at ${form.getValues("venue_name")}`,
          variant: "default",
        });
      }
      
      // Navigate back to home page
      navigate("/");
    },
    onError: (error) => {
      console.error("Check-in error:", error);
      toast({
        title: "Check-in Failed",
        description: error.message || "There was a problem with your check-in. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit handler for the form
  const onSubmit = (data: CheckInFormValues) => {
    checkInMutation.mutate(data);
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
                  onSelectPlace={handleSelectPlace}
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
