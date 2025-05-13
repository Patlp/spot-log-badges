
// Re-export from the proper source
import { useToast as useToastOrig, toast as toastOrig } from "@/components/ui/use-toast";

export const useToast = useToastOrig;

// Add direct toast function for easier access in components
export function toast(props: { title?: string; description?: string; variant?: "default" | "destructive" | "warning" | undefined; duration?: number }) {
  return toastOrig({
    ...props,
    // We need to remove duration from props before passing to toastOrig since it doesn't accept it
    duration: undefined, // Remove this prop before spreading into toastOrig
  });
}
