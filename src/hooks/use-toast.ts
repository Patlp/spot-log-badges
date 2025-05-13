
// Re-export from the proper source
import { useToast as useToastOrig, toast as toastOrig } from "@/components/ui/use-toast";

export const useToast = useToastOrig;

// Add direct toast function for easier access in components
export function toast(props: { title?: string; description?: string; variant?: "default" | "destructive" | "warning" }) {
  return toastOrig(props);
}
