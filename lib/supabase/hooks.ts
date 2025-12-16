"use client"

import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"
import type { UserProfile, UserRole } from "./auth"

export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUser(user)

        // Fetch profile
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        setProfile(profile as UserProfile | null)
      }

      setLoading(false)
    }

    loadUser()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        loadUser()
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, profile, loading }
}

export function useHasRole(role: UserRole) {
  const { profile } = useUser()

  return profile?.role === role || profile?.is_admin === true
}

export function useIsAdmin() {
  const { profile } = useUser()

  return profile?.is_admin === true
}
