
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { supabase, createCheckIn, VenueType } from "../lib/supabase";
import { useToast } from "@/components/ui/use-toast";
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
import { MapPin, Save, Clock, Loader2, MapIcon, LocateFixed, Search } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGeolocation } from "@/hooks/use-geolocation";
import { getNearbyPlaces, mapGoogleTypeToVenueType } from "@/services/places";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card as CardComponent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
          const places = await getNearbyPlaces(geolocation.latitude, geolocation.longitude);
          setNearbyPlaces(places);
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
  }, [useLocation, geolocation, toast]);

  // Toggle location usage
  const handleToggleLocation = () => {
    setUseLocation(!useLocation);
    if (!useLocation && geolocation.error) {
      toast({
        title: "Location Error",
        description: geolocation.error,
        variant: "destructive",
      });
    }
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Location Toggle */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <LocateFixed className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>Use my current location</span>
                </div>
                <Button
                  type="button"
                  variant={useLocation ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleLocation}
                  disabled={geolocation.loading}
                >
                  {geolocation.loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : useLocation ? (
                    "Enabled"
                  ) : (
                    "Disabled"
                  )}
                </Button>
              </div>

              {/* Location Status */}
              {useLocation && (
                <div className="mb-4">
                  {geolocation.error ? (
                    <Alert variant="destructive">
                      <AlertDescription>{geolocation.error}</AlertDescription>
                    </Alert>
                  ) : geolocation.loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Getting your location...</span>
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        Location found! Coordinates: {geolocation.latitude.toFixed(4)}, {geolocation.longitude.toFixed(4)}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Nearby Places */}
              {useLocation && !geolocation.loading && !geolocation.error && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Nearby Places</h3>
                  {isLoadingPlaces ? (
                    <div className="space-y-2">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : nearbyPlaces.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        No places found nearby. Try expanding the search area or enter venue details manually.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="grid gap-2 max-h-64 overflow-y-auto">
                      {nearbyPlaces.map((place) => (
                        <CardComponent 
                          key={place.place_id}
                          className={`cursor-pointer p-3 ${selectedPlace?.place_id === place.place_id ? 'border-2 border-primary' : ''}`}
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
              )}

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
            </CardContent>

            <CardFooter>
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
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default CheckInPage;
