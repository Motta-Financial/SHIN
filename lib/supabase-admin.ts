import { createClient } from "@supabase/supabase-js"

/**
 * Admin client for Supabase with service role key
 * Use this ONLY in server-side code (API routes, Server Actions)
 * This bypasses RLS policies - use with caution!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing Supabase admin credentials. Please set SUPABASE_SERVICE_ROLE_KEY in your environment variables.",
    )
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
