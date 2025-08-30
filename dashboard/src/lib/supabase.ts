import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Supabase configuration (same as existing backend)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://totgazkleqdkdsebyahk.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvdGdhemtsZXFka2RzZWJ5YWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTI1NjUsImV4cCI6MjA3MDk2ODU2NX0.1I-_jpS_EuuPfmk2F7ZCvBn5wYJ1SD0ExzD3DwulJ4Q'

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Export configuration for use elsewhere
export { SUPABASE_URL, SUPABASE_ANON_KEY }

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any): string => {
  if (error?.message) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}

// Helper function to format Supabase timestamps
export const formatSupabaseDate = (timestamp: string): Date => {
  return new Date(timestamp)
}