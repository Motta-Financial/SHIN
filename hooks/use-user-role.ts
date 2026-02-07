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

async function fetchUserRoleOnce(supabase: ReturnType<typeof createClient>, user: { id: string; email?: string }): Promise<UserRoleData> {
  const userEmail = user.email || ""

  // Check all three role tables with a small delay between each to avoid rate limits
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

  const { data: studentData } = await supabase
    .from("students_current")
    .select("id, email, full_name, clinic_id, clinic, client_id")
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
      clientId: studentData.client_id || null,
      isLoading: false,
      isAuthenticated: true,
    }
  }

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
}

async function fetchUserRole(): Promise<UserRoleData> {
  const supabase = createClient()

  // First, check if user is authenticated (this rarely rate-limits)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
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

  // Check sessionStorage cache from sign-in page (avoids redundant Supabase queries)
  if (typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem("shin_role_cache")
      if (cached) {
        const parsed = JSON.parse(cached)
        // Only use cache if it's fresh (< 60 seconds) and matches the current user
        if (parsed.authUserId === user.id && Date.now() - parsed.timestamp < 60000 && parsed.role) {
          return {
            role: parsed.role as UserRole,
            userId: parsed.userId,
            authUserId: user.id,
            email: user.email || null,
            fullName: parsed.userName || null,
            clinicId: parsed.clinicId || null,
            clinicName: null,
            studentId: parsed.studentId || null,
            directorId: parsed.directorId || null,
            clientId: parsed.clientId || null,
            isLoading: false,
            isAuthenticated: true,
          }
        }
      }
    } catch {}
  }

  // User IS authenticated. Now try to resolve their role with retries.
  // Even if role lookup fails, isAuthenticated stays true.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fetchUserRoleOnce(supabase, user)
    } catch (error: any) {
      const msg = (error?.message || "").toLowerCase()
      const isRateLimit = msg.includes("too many") || msg.includes("rate limit") || msg.includes("unexpected token")
      if (isRateLimit && attempt < 2) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt + 1) * 2000))
        continue
      }
      console.error("useUserRole - Role lookup failed:", error)
      // Return authenticated but with null role - prevents redirect to sign-in
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
    }
  }
  // Fallback: authenticated but role unknown
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

      // TOKEN_REFRESHED with same user - keep existing cache, don't refetch
      // This prevents rate-limit-induced cache clearing that causes auth flicker
      if (event === "TOKEN_REFRESHED" && globalAuthCache) {
        lastAuthEmail = sessionEmail
        return
      }

      if (event === "SIGNED_OUT") {
        globalAuthCache = null
        globalAuthPromise = null
        cacheTimestamp = 0
        lastAuthEmail = null
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
        return
      }

      if (event === "SIGNED_IN" || lastAuthEmail !== sessionEmail) {
        // New sign-in or different user - clear cache and refetch
        globalAuthCache = null
        globalAuthPromise = null
        cacheTimestamp = 0
        lastAuthEmail = sessionEmail

        if (session?.user) {
          globalAuthPromise = fetchUserRole()
          globalAuthPromise.then((result) => {
            globalAuthCache = result
            cacheTimestamp = Date.now()
            globalAuthPromise = null
            setData(result)
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
