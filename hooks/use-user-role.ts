"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export type UserRole = "admin" | "director" | "student" | "client" | null

interface UserRoleData {
  role: UserRole
  userId: string | null
  authUserId: string | null // The Supabase Auth user ID
  email: string | null
  fullName: string | null
  clinicId: string | null
  clinicName: null
  studentId: string | null
  directorId: string | null
  clientId: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

let globalAuthCache: UserRoleData | null = null
let globalAuthPromise: Promise<UserRoleData> | null = null
let cacheTimestamp = 0
let lastAuthEmail: string | null = null // Track the email to detect user changes
const CACHE_TTL = 30000

async function fetchUserRole(): Promise<UserRoleData> {
  const supabase = createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return {
        role: null,
        userId: null,
        authUserId: null,
        email: null,
        fullName: null,
        clinicId: null,
        clinicName: null,
        studentId: null,
        directorId: null,
        clientId: null,
        isLoading: false,
        isAuthenticated: false,
      }
    }

    const userEmail = user.email || ""

    // Check directors table - use directors_current view for current semester
    const { data: directorData } = await supabase
      .from("directors_current")
      .select("id, email, role, full_name, clinic_id")
      .ilike("email", userEmail)
      .maybeSingle()

    if (directorData) {
      return {
        role: "director",
        userId: directorData.id,
        authUserId: user.id,
        email: user.email || null,
        fullName: directorData.full_name || null,
        clinicId: directorData.clinic_id || null,
        clinicName: null,
        studentId: null,
        directorId: directorData.id,
        clientId: null,
        isLoading: false,
        isAuthenticated: true,
      }
    }

    // Check students table - use students_current view to get ONLY the current semester's record
    // This is critical because a student may exist in multiple semesters with different IDs
    const { data: studentData } = await supabase
      .from("students_current")
      .select("id, email, full_name, clinic_id, clinic")
      .ilike("email", userEmail)
      .maybeSingle()

    if (studentData) {
      return {
        role: "student",
        userId: studentData.id,
        authUserId: user.id,
        email: user.email || null,
        fullName: studentData.full_name || null,
        clinicId: studentData.clinic_id || null,
        clinicName: null,
        studentId: studentData.id,
        directorId: null,
        clientId: null,
        isLoading: false,
        isAuthenticated: true,
      }
    }

    // Check clients table - use clients_current view for current semester
    const { data: clientData } = await supabase
      .from("clients_current")
      .select("id, name, email")
      .ilike("email", userEmail)
      .maybeSingle()

    if (clientData) {
      return {
        role: "client",
        userId: clientData.id,
        authUserId: user.id,
        email: user.email || null,
        fullName: clientData.name || null,
        clinicId: null,
        clinicName: null,
        studentId: null,
        directorId: null,
        clientId: clientData.id,
        isLoading: false,
        isAuthenticated: true,
      }
    }

    // No role found
    return {
      role: null,
      userId: user.id,
      authUserId: user.id,
      email: user.email || null,
      fullName: null,
      clinicId: null,
      clinicName: null,
      studentId: null,
      directorId: null,
      clientId: null,
      isLoading: false,
      isAuthenticated: true,
    }
  } catch (error) {
    console.error("[v0] useUserRole - Error:", error)
    return {
      role: null,
      userId: null,
      authUserId: null,
      email: null,
      fullName: null,
      clinicId: null,
      clinicName: null,
      studentId: null,
      directorId: null,
      clientId: null,
      isLoading: false,
      isAuthenticated: false,
    }
  }
}

export function useUserRole(): UserRoleData {
  const [data, setData] = useState<UserRoleData>({
    role: null,
    userId: null,
    authUserId: null,
    email: null,
    fullName: null,
    clinicId: null,
    clinicName: null,
    studentId: null,
    directorId: null,
    clientId: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionEmail = session?.user?.email || null

      // If auth state changed (sign in, sign out, or different user), clear cache and refetch
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED" ||
        lastAuthEmail !== sessionEmail
      ) {
        // Clear the stale cache
        globalAuthCache = null
        globalAuthPromise = null
        cacheTimestamp = 0
        lastAuthEmail = sessionEmail

        if (session?.user) {
          // Fetch fresh role data
          globalAuthPromise = fetchUserRole()
          globalAuthPromise.then((result) => {
            globalAuthCache = result
            cacheTimestamp = Date.now()
            globalAuthPromise = null
            setData(result)
          })
        } else {
          setData({
            role: null,
            userId: null,
            authUserId: null,
            email: null,
            fullName: null,
            clinicId: null,
            clinicName: null,
            studentId: null,
            directorId: null,
            clientId: null,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      }
    })

    // Initial fetch
    const now = Date.now()
    if (globalAuthCache && now - cacheTimestamp < CACHE_TTL) {
      setData(globalAuthCache)
      return () => subscription.unsubscribe()
    }

    if (globalAuthPromise) {
      globalAuthPromise.then((result) => setData(result))
      return () => subscription.unsubscribe()
    }

    globalAuthPromise = fetchUserRole()
    globalAuthPromise.then((result) => {
      globalAuthCache = result
      cacheTimestamp = Date.now()
      globalAuthPromise = null
      setData(result)
    })

    return () => subscription.unsubscribe()
  }, [])

  return data
}

// Helper functions for role-based access
export function canAccessPortal(role: UserRole, portal: "director" | "student" | "client"): boolean {
  if (!role) return false
  switch (role) {
    case "admin":
    case "director":
      return true
    case "student":
      return portal === "student" || portal === "client"
    case "client":
      return portal === "client"
    default:
      return false
  }
}

export function getDefaultPortal(role: UserRole): string {
  switch (role) {
    case "admin":
    case "director":
      return "/director"
    case "student":
      return "/students"
    case "client":
      return "/client-portal"
    default:
      return "/login"
  }
}

export function getAllowedPortals(role: UserRole): string[] {
  switch (role) {
    case "admin":
    case "director":
      return ["director", "student", "client"]
    case "student":
      return ["student", "client"]
    case "client":
      return ["client"]
    default:
      return []
  }
}

export function clearAuthCache(): void {
  globalAuthCache = null
  globalAuthPromise = null
  cacheTimestamp = 0
  lastAuthEmail = null
}
