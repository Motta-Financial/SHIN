import { createClient } from "@supabase/supabase-js"

// Service role client for admin operations that bypass RLS
export function createServiceClient() {
  // Handle multiple possible env var names for Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[v0] createServiceClient - Missing env vars. URL:", !!supabaseUrl, "Key:", !!serviceRoleKey)
    throw new Error("Missing Supabase service role credentials")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  })
}
