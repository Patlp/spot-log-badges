
// Re-export from the proper source
import { useToast as useToastOrig, toast as toastOrig } from "@/components/ui/use-toast";

export const useToast = useToastOrig;

// Add direct toast function for easier access in components
export function toast(props: { title?: string; description?: string; variant?: "default" | "destructive" | "warning" | undefined; duration?: number }) {
  return toastOrig({
    ...props,
    // Default duration of 5000ms (5 seconds) if not specified
    duration: props.duration ?? 5000,
  });
}
