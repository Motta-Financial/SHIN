"use client"

import { createClient } from "@/utils/supabase/client"
import { useEffect, useState, useCallback } from "react"
import type { UserProfile, UserRole } from "./auth"

// Singleton supabase client for browser
let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient()
  }
  return supabaseClient
}

export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    try {
      const supabase = getSupabaseClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      setUser(user)

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.log("[v0] Profile not found, may need to be created")
        setProfile(null)
      } else {
        setProfile(profileData as UserProfile)
      }
    } catch (error) {
      console.error("[v0] Error loading user:", error)
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const supabase = getSupabaseClient()

    loadUser()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser()
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadUser])

  return { user, profile, loading, refetch: loadUser }
}

export function useHasRole(role: UserRole) {
  const { profile } = useUser()

  if (!profile) return false
  return profile.role === role || profile.is_admin === true
}

export function useIsAdmin() {
  const { profile } = useUser()

  return profile?.is_admin === true
}
