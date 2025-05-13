
import * as React from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast as useToastOrig } from "@/components/ui/use-toast"

// Re-export the useToast hook
export const useToast = useToastOrig;

// Add direct toast function for easier access in components
export function toast(props: { title?: string; description?: string; variant?: "default" | "destructive" | "warning" }) {
  const { toast: toastFn } = useToastOrig();
  return toastFn(props);
}
