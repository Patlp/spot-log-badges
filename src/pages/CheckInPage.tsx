import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { supabase, createCheckIn, VenueType } from "../lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin, Save, Clock, Loader2, MapIcon, LocateFixed, Search, Building, AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGeolocation } from "@/hooks/use-geolocation";
import { getNearbyPlaces, mapGoogleTypeToVenueType } from "@/services/places";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card as CardComponent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define the form validation schema using zod
const checkInSchema = z.object({
  venue_name: z.string().min(2, { message: "Venue name must be at least 2 characters" }),
  venue_type: z.enum(["Bar", "Restaurant", "Club", "Event", "Other"]),
  location: z.string().min(2, { message: "Location must be at least 2 characters" }),
  check_in_time: z.string(),
  notes: z.string().optional(),
});

type CheckInFormValues = z.infer<typeof checkInSchema>;

type PlaceOption = {
  name: string;
  address: string;
  place_id: string;
  types: string[];
  latitude: number;
  longitude: number;
};

const CheckInPage = () => {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [useLocation, setUseLocation] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceOption[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceOption | null>(null);
  const geolocation = useGeolocation();
  const [activeTab, setActiveTab] = useState<string>("manual");
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [forceReattempt, setForceReattempt] = useState(false);

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
      form.setValue("venue_type", mapGoogleTypeToVenueType(selectedPlace.types));
    }
  }, [selectedPlace, form]);

  // Fetch nearby places when use location is toggled on and we have coordinates
  useEffect(() => {
    const fetchPlaces = async () => {
      if (useLocation && !geolocation.loading && !geolocation.error && geolocation.latitude && geolocation.longitude) {
        setIsLoadingPlaces(true);
        try {
          console.log("Fetching places at coordinates:", geolocation.latitude, geolocation.longitude);
          const places = await getNearbyPlaces(geolocation.latitude, geolocation.longitude);
          console.log("Fetched places:", places);
          setNearbyPlaces(places);
          
          // If we successfully got places, switch to the nearby tab
          if (places.length > 0) {
            setActiveTab("nearby");
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
      }
    };

    fetchPlaces();
  }, [useLocation, geolocation.latitude, geolocation.longitude, geolocation.loading, geolocation.error, toast, forceReattempt]);

  // Check permission state and handle Safari-specific issues
  useEffect(() => {
    // Safari on iOS sometimes reports incorrect permission state
    // If we have actual coordinates, treat permission as granted regardless of reported state
    if (geolocation.latitude !== 0 && geolocation.longitude !== 0 && !geolocation.loading) {
      setShowPermissionPrompt(false);
      
      if (useLocation && !isLoadingPlaces && nearbyPlaces.length === 0) {
        // We have location but no places yet, trigger a fetch
        const fetchPlaces = async () => {
          setIsLoadingPlaces(true);
          try {
            const places = await getNearbyPlaces(geolocation.latitude, geolocation.longitude);
            setNearbyPlaces(places);
            
            if (places.length > 0) {
              setActiveTab("nearby");
            }
          } catch (error) {
            console.error("Error fetching places:", error);
          } finally {
            setIsLoadingPlaces(false);
          }
        };
        fetchPlaces();
      }
    } else if (geolocation.permissionState === 'denied' && useLocation) {
      setShowPermissionPrompt(true);
    } else if (geolocation.error && useLocation) {
      setShowPermissionPrompt(true);
    } else {
      setShowPermissionPrompt(false);
    }
  }, [geolocation, useLocation, isLoadingPlaces, nearbyPlaces]);

  // Update location toggle handler with improved Safari support
  const handleToggleLocation = async () => {
    // Always try to get location regardless of reported permission state
    // This works better with Safari which sometimes misreports permission state
    setUseLocation(true);
    await geolocation.requestPermission();
    
    // Artificial delay to let the browser handle the permission prompt
    setTimeout(async () => {
      await geolocation.requestPermission();
      // Force a re-fetch of places with a new value
      setForceReattempt(prev => !prev);
    }, 500);
  };

  // Force a retry of location detection
  const handleRetryLocation = async () => {
    setUseLocation(true);
    await geolocation.requestPermission();
    setForceReattempt(prev => !prev);
  };

  // Select a place from the nearby places list
  const handleSelectPlace = (place: PlaceOption) => {
    setSelectedPlace(place);
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
          {/* Enhanced Location Button with better Safari support */}
          <div className="mb-8">
            <Button
              type="button"
              variant={useLocation ? "default" : "outline"}
              className="w-full"
              onClick={handleToggleLocation}
              disabled={isLoadingPlaces}
            >
              {isLoadingPlaces ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding places nearby...
                </>
              ) : useLocation && geolocation.latitude !== 0 ? (
                <>
                  <LocateFixed className="mr-2 h-4 w-4" />
                  Using your location • Tap to refresh
                </>
              ) : (
                <>
                  <LocateFixed className="mr-2 h-4 w-4" />
                  Find places near me
                </>
              )}
            </Button>

            {/* Location Status & Debug Info */}
            {useLocation && !isLoadingPlaces && (
              <div className="mt-2">
                {geolocation.error ? (
                  <div className="flex flex-col gap-2">
                    <div className="text-sm text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Error: Location unavailable</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-1"
                      onClick={handleRetryLocation}
                    >
                      <LocateFixed className="mr-2 h-3 w-3" />
                      Retry Getting Location
                    </Button>
                  </div>
                ) : geolocation.latitude !== 0 ? (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>Location found{' '}
                      {nearbyPlaces.length > 0 && `(${nearbyPlaces.length} places nearby)`}
                    </span>
                  </div>
                ) : geolocation.loading ? (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Getting your location...</span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Enhanced Permission Status Display for Safari */}
            {showPermissionPrompt && (
              <Alert 
                className="mt-2 animate-in fade-in-50"
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Location Access Required</AlertTitle>
                <AlertDescription className="text-xs">
                  {navigator.userAgent.includes("Safari") || navigator.userAgent.includes("iPad") ? (
                    <>
                      <p>For iPad/Safari users:</p>
                      <ol className="list-decimal ml-5 mt-1 space-y-1">
                        <li>Tap "AA" in your address bar</li>
                        <li>Tap "Website Settings"</li>
                        <li>Ensure "Location" is set to "Allow"</li>
                        <li>Reload this page</li>
                      </ol>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mt-2"
                        onClick={handleRetryLocation}
                      >
                        <LocateFixed className="mr-2 h-3 w-3" />
                        Try Again
                      </Button>
                    </>
                  ) : (
                    <p>Please enable location services in your browser settings and reload the page.</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Only show loading/success states when not showing permission prompt */}
            {!showPermissionPrompt && useLocation && (
              <div className="mt-2">
                {geolocation.loading ? (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Getting your location...</span>
                  </div>
                ) : geolocation.error ? (
                  <div className="text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{geolocation.error}</span>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Location found at {geolocation.latitude.toFixed(4)}, {geolocation.longitude.toFixed(4)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabs for Manual or Nearby Places */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">
                <Building className="h-4 w-4 mr-2" />
                Manual Entry
              </TabsTrigger>
              <TabsTrigger 
                value="nearby" 
                disabled={isLoadingPlaces && nearbyPlaces.length === 0}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {nearbyPlaces.length > 0 
                  ? `Nearby Places (${nearbyPlaces.length})` 
                  : 'Nearby Places'}
              </TabsTrigger>
            </TabsList>

            {/* Manual Entry Tab */}
            <TabsContent value="manual" className="pt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
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
            </TabsContent>

            {/* Nearby Places Tab with enhanced error handling */}
            <TabsContent value="nearby" className="pt-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-3">Select a place to check in</h3>
              
                {isLoadingPlaces ? (
                  <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : nearbyPlaces.length === 0 ? (
                  <Alert>
                    <AlertTitle>No places found</AlertTitle>
                    <AlertDescription>
                      <p>No places found nearby. Try these options:</p>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleRetryLocation}
                        >
                          <LocateFixed className="mr-2 h-3 w-3" />
                          Retry
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setActiveTab("manual")}
                        >
                          <Building className="mr-2 h-3 w-3" />
                          Manual Entry
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-2 max-h-64 overflow-y-auto">
                    {nearbyPlaces.map((place) => (
                      <CardComponent 
                        key={place.place_id}
                        className={`cursor-pointer p-3 transition ${selectedPlace?.place_id === place.place_id ? 'border-2 border-primary ring-1 ring-primary' : 'hover:border-primary/50'}`}
                        onClick={() => handleSelectPlace(place)}
                      >
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium">{place.name}</h4>
                            <p className="text-sm text-muted-foreground">{place.address}</p>
                          </div>
                          <Badge>{mapGoogleTypeToVenueType(place.types)}</Badge>
                        </div>
                      </CardComponent>
                    ))}
                  </div>
                )}
              </div>

              {selectedPlace && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border-t pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{selectedPlace.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedPlace.address}</p>
                      </div>
                      <Badge>{mapGoogleTypeToVenueType(selectedPlace.types)}</Badge>
                    </div>

                    {/* Date/Time for selected place */}
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

                    {/* Notes for selected place */}
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
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
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
