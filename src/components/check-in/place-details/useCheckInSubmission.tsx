
// This component is part of the check-in system
// It handles submission of check-in data and provides diagnostic information

import { useState, useContext } from "react";
import { useCheckInEngine } from "@/lib/checkinEngine";
import { AuthContext } from "../../../App";
import { toast } from "@/hooks/use-toast";
import { Place } from "../PlacesList";
import { UseFormReturn } from "react-hook-form";
import { CheckInFormValues } from "../ManualCheckInForm";

interface UseCheckInSubmissionProps {
  selectedPlace: Place;
  form: UseFormReturn<CheckInFormValues>;
  onSubmit: (values: any) => void;
}

export function useCheckInSubmission({ selectedPlace, form, onSubmit }: UseCheckInSubmissionProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<string | null>(null);
  const { user } = useContext(AuthContext);
  
  // Use our check-in engine with debug mode enabled but handle navigation manually
  const { checkIn, isSubmitting: engineIsSubmitting } = useCheckInEngine({ 
    debugMode: true,
    enableRedirect: false,
    enableToasts: false
  });

  // Display diagnostic info for 5 seconds
  const showDiagnostic = (message: string) => {
    console.log("[PlaceDetails] Diagnostic:", message);
    setDiagnosticInfo(message);
    
    setTimeout(() => {
      setDiagnosticInfo(null);
    }, 5000);
  };

  const handleSubmit = async (values: any) => {
    // This function is now mostly for completeness since we're focusing on mood check-ins
    // But we'll maintain it for compatibility with the existing form structure
    
    // Clear previous errors and show diagnostic
    setSubmitError(null);
    showDiagnostic("Form submission intercepted - using mood check-in instead");
    
    // Simply prevent default form submission, as mood check-in is handled separately
    return false;
  };

  return {
    submitError,
    diagnosticInfo,
    engineIsSubmitting,
    showDiagnostic,
    handleSubmit
  };
}
