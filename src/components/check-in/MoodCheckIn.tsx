
import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { AuthContext } from "../../App";
import { supabase } from "@/integrations/supabase/client";
import { Smile, Meh, Frown, Brain } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MoodCheckInProps {
  venueName: string;
}

type MoodOption = {
  label: string;
  icon: React.ReactNode;
  value: string;
};

export function MoodCheckIn({ venueName }: MoodCheckInProps) {
  const { user } = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Define mood options with emojis
  const moodOptions: MoodOption[] = [
    { label: "Happy", icon: <Smile className="h-6 w-6" />, value: "happy" },
    { label: "Chill", icon: <Meh className="h-6 w-6" />, value: "chill" },
    { label: "Focused", icon: <Brain className="h-6 w-6" />, value: "focused" },
    { label: "Tired", icon: <Frown className="h-6 w-6" />, value: "tired" },
  ];

  const handleMoodSubmit = async (mood: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to check in your mood.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert the mood check-in record
      const { error } = await supabase.from("mood_check_ins").insert({
        user_id: user.id,
        venue_name: venueName,
        mood: mood,
      });

      if (error) {
        console.error("Error saving mood check-in:", error);
        toast({
          title: "Check-in Failed",
          description: "There was a problem saving your mood. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Show success toast
      toast({
        title: "Mood saved!",
        description: "Thanks for checking in.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error in mood check-in:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">How are you feeling here?</h3>
      
      <div className="flex flex-wrap gap-2">
        {moodOptions.map((option) => (
          <Button
            key={option.value}
            variant="outline"
            className="flex items-center gap-2 px-4 py-2 h-auto"
            onClick={() => handleMoodSubmit(option.value)}
            disabled={isSubmitting}
          >
            {option.icon}
            <span>{option.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
