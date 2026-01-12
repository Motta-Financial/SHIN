"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export type UserRole = "admin" | "director" | "student" | "client" | null

interface UserRoleData {
  role: UserRole
  userId: string | null
  email: string | null
  fullName: string | null
  clinicId: string | null
  clinicName: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

let globalAuthCache: UserRoleData | null = null
let globalAuthPromise: Promise<UserRoleData> | null = null
let cacheTimestamp = 0
const CACHE_TTL = 30000 // 30 seconds cache

async function fetchUserRoleWithRetry(retries = 3, delay = 1000): Promise<UserRoleData> {
  const supabase = createClient()

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        // If it's a 500 error, retry
        if (error.message?.includes("500") || error.message?.includes("unexpected_failure")) {
          if (attempt < retries - 1) {
            await new Promise((r) => setTimeout(r, delay * (attempt + 1)))
            continue
          }
        }

        return {
          role: null,
          userId: null,
          email: null,
          fullName: null,
          clinicId: null,
          clinicName: null,
          isLoading: false,
          isAuthenticated: false,
        }
      }

      if (!user) {
        return {
          role: null,
          userId: null,
          email: null,
          fullName: null,
          clinicId: null,
          clinicName: null,
          isLoading: false,
          isAuthenticated: false,
        }
      }

      const userEmail = user.email || ""

      // Check directors table
      const { data: directorData } = await supabase
        .from("directors")
        .select("id, email, role, full_name, clinic_id")
        .ilike("email", userEmail)
        .maybeSingle()

      if (directorData) {
        console.log("[v0] useUserRole - Found director role")
        return {
          role: (directorData.role as UserRole) || "director",
          userId: user.id,
          email: user.email || null,
          fullName: directorData.full_name || null,
          clinicId: directorData.clinic_id || null,
          clinicName: null,
          isLoading: false,
          isAuthenticated: true,
        }
      }

      // Check students table
      const { data: studentData } = await supabase
        .from("students")
        .select("id, email, full_name, clinic_id, clinic")
        .ilike("email", userEmail)
        .maybeSingle()

      if (studentData) {
        console.log("[v0] useUserRole - Found student role")
        return {
          role: "student",
          userId: user.id,
          email: user.email || null,
          fullName: studentData.full_name || null,
          clinicId: studentData.clinic_id || null,
          clinicName: studentData.clinic || null,
          isLoading: false,
          isAuthenticated: true,
        }
      }

      // Check clients table
      const { data: clientData } = await supabase
        .from("clients")
        .select("id, name, email")
        .ilike("email", userEmail)
        .maybeSingle()

      if (clientData) {
        console.log("[v0] useUserRole - Found client role")
        return {
          role: "client",
          userId: user.id,
          email: user.email || null,
          fullName: clientData.name || null,
          clinicId: null,
          clinicName: null,
          isLoading: false,
          isAuthenticated: true,
        }
      }

      // No role found - user is authenticated but not in system
      console.log("[v0] useUserRole - No role found for:", userEmail)
      return {
        role: null,
        userId: user.id,
        email: user.email || null,
        fullName: null,
        clinicId: null,
        clinicName: null,
        isLoading: false,
        isAuthenticated: true,
      }
    } catch (error) {
      console.error("[v0] useUserRole - Attempt", attempt + 1, "failed:", error)
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, delay * (attempt + 1)))
      }
    }
  }

  // All retries failed
  return {
    role: null,
    userId: null,
    email: null,
    fullName: null,
    clinicId: null,
    clinicName: null,
    isLoading: false,
    isAuthenticated: false,
  }
}

export function useUserRole(): UserRoleData {
  const [data, setData] = useState<UserRoleData>(() => {
    if (globalAuthCache && Date.now() - cacheTimestamp < CACHE_TTL) {
      return globalAuthCache
    }
    return {
      role: null,
      userId: null,
      email: null,
      fullName: null,
      clinicId: null,
      clinicName: null,
      isLoading: true,
      isAuthenticated: false,
    }
  })

  useEffect(() => {
    if (globalAuthCache && Date.now() - cacheTimestamp < CACHE_TTL) {
      setData(globalAuthCache)
      return
    }

    if (globalAuthPromise) {
      globalAuthPromise.then((result) => {
        setData(result)
      })
      return
    }

    globalAuthPromise = fetchUserRoleWithRetry()

    globalAuthPromise.then((result) => {
      globalAuthCache = result
      cacheTimestamp = Date.now()
      globalAuthPromise = null
      setData(result)
    })
  }, [])

  return data
}

export function invalidateAuthCache() {
  globalAuthCache = null
  globalAuthPromise = null
  cacheTimestamp = 0
}

// Helper to check if user can access a portal
export function canAccessPortal(role: UserRole, portal: "director" | "student" | "client"): boolean {
  if (!role) return false

  switch (role) {
    case "admin":
      return true // Admins can access all portals
    case "director":
      return true // Directors can access all portals
    case "student":
      return portal === "student" || portal === "client" // Students can access student and client portals
    case "client":
      return portal === "client" // Clients can only access client portal
    default:
      return false
  }
}

// Helper to get allowed portals for a role
export function getAllowedPortals(role: UserRole): Array<"director" | "student" | "client"> {
  if (!role) return []

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

// Helper to get default portal for a role
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
      return "/sign-in" // Return sign-in page instead of root
  }
}
