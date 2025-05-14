
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCheckIn } from "@/hooks/use-check-in";
import { toast } from "@/hooks/use-toast";

interface TestCheckInButtonProps {
  userId: string | undefined;
}

export function TestCheckInButton({ userId }: TestCheckInButtonProps) {
  const { checkIn, isSubmitting } = useCheckIn();

  // Function to handle the test check-in
  const handleTestCheckIn = () => {
    console.log("[TestCheckInButton] Testing check-in with sample data");
    
    // Use actual user ID if available, otherwise use a test ID
    const testUserId = userId || "test-user-id";
    
    if (!userId) {
      toast({
        title: "Note",
        description: "Using test user ID since you're not logged in",
        variant: "warning",
        duration: 3000,
      });
    }
    
    checkIn({ 
      venue_name: "Test Place",
      venue_type: "Restaurant", 
      location: "Test Location",
      check_in_time: new Date().toISOString(),
      user_id: testUserId 
    });
  };

  return (
    <Button 
      onClick={handleTestCheckIn} 
      variant="outline" 
      className="mb-4 w-full"
      disabled={isSubmitting}
    >
      Test Check-In Function
    </Button>
  );
}
