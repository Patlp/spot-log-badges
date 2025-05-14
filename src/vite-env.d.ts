
/// <reference types="vite/client" />

// Custom type definitions for Supabase errors
interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  stack?: string;
}

