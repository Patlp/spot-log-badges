
// Re-export from the proper source using the Sonner toast library
import { toast as sonnerToast, ToastT } from "sonner";

// Provide a consistent toast API that wraps Sonner
export function toast(props: { 
  title?: string; 
  description?: string; 
  variant?: "default" | "destructive" | "warning" | undefined; 
  duration?: number 
}) {
  const { title, description, variant, duration = 5000 } = props;
  
  console.log("[toast] Showing toast:", { title, description, variant, duration });
  
  // Map our variants to Sonner variants
  const sonnerVariant = variant === "destructive" ? "error" : 
                         variant === "warning" ? "warning" : 
                         "default";
  
  // Call Sonner toast with our mapped properties
  return sonnerToast(title || "", {
    description,
    duration,
    className: variant ? `toast-${variant}` : undefined
  });
}

// Export a hook-based version with the same API
export function useToast() {
  return {
    toast
  };
}
