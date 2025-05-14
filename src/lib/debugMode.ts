
// Debug flag for the check-in system
// Set to true during development to enable additional diagnostic logging

export const isDebugMode = process.env.NODE_ENV !== 'production' || false;

// Helper for conditional debug logging
export const debugLog = (component: string, message: string, data?: any) => {
  if (isDebugMode) {
    if (data) {
      console.log(`[DEBUG:${component}] ${message}`, data);
    } else {
      console.log(`[DEBUG:${component}] ${message}`);
    }
  }
};

// Helper for conditional debug toast
export const debugToast = (toastFn: Function, title: string, description?: string) => {
  if (isDebugMode) {
    toastFn({
      title: `Debug: ${title}`,
      description: description ? `Debug: ${description}` : undefined,
      duration: 3000
    });
    return true;
  }
  return false;
};
