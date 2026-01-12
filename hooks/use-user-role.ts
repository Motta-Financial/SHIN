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

      try {
        const response = await fetch("/api/auth/user-role")
        const roleData = await response.json()

        if (roleData.role) {
          return {
            role: roleData.role,
            userId: user.id,
            email: user.email || null,
            fullName: roleData.fullName || null,
            clinicId: roleData.clinicId || null,
            clinicName: roleData.clinicName || null,
            isLoading: false,
            isAuthenticated: true,
          }
        }
      } catch (roleError) {
        console.error("[v0] useUserRole - Error fetching role from database:", roleError)
      }

      // Fallback: return authenticated but no role
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
      return "/"
  }
}
