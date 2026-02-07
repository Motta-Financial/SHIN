"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export type UserRole = "admin" | "director" | "student" | "client" | null

interface UserRoleData {
  role: UserRole
  userId: string | null
  authUserId: string | null
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

// ── Global in-memory cache ──────────────────────────────────────────
let globalAuthCache: UserRoleData | null = null
let globalAuthPromise: Promise<UserRoleData> | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// ── sessionStorage helpers ──────────────────────────────────────────
const SS_KEY = "shin_role_cache"
const SS_TTL = 5 * 60 * 1000 // 5 minutes

function readSessionCache(authUserId?: string): UserRoleData | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(SS_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (authUserId && p.authUserId !== authUserId) return null
    if (Date.now() - p.timestamp > SS_TTL) return null
    if (!p.role) return null
    return {
      role: p.role as UserRole,
      userId: p.userId,
      authUserId: p.authUserId,
      email: p.email,
      fullName: p.userName || p.fullName || null,
      clinicId: p.clinicId || null,
      clinicName: null,
      studentId: p.studentId || null,
      directorId: p.directorId || null,
      clientId: p.clientId || null,
      isLoading: false,
      isAuthenticated: true,
    }
  } catch {
    return null
  }
}

function writeSessionCache(data: UserRoleData) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify({
      role: data.role,
      userId: data.userId,
      authUserId: data.authUserId,
      email: data.email,
      userName: data.fullName,
      clinicId: data.clinicId,
      studentId: data.studentId,
      directorId: data.directorId,
      clientId: data.clientId,
      timestamp: Date.now(),
    }))
  } catch {}
}

// ── Default empty state ─────────────────────────────────────────────
const EMPTY: UserRoleData = {
  role: null, userId: null, authUserId: null, email: null,
  fullName: null, clinicId: null, clinicName: null,
  studentId: null, directorId: null, clientId: null,
  isLoading: false, isAuthenticated: false,
}

const LOADING: UserRoleData = { ...EMPTY, isLoading: true }

// ── Single Supabase role-lookup ─────────────────────────────────────
async function fetchUserRoleOnce(
  supabase: ReturnType<typeof createClient>,
  user: { id: string; email?: string },
): Promise<UserRoleData> {
  const email = user.email || ""

  const { data: d } = await supabase
    .from("directors_current")
    .select("id, email, role, full_name, clinic_id")
    .ilike("email", email)
    .maybeSingle()

  if (d) {
    return {
      role: "director", userId: d.id, authUserId: user.id,
      email: user.email || null, fullName: d.full_name || null,
      clinicId: d.clinic_id || null, clinicName: null,
      studentId: null, directorId: d.id, clientId: null,
      isLoading: false, isAuthenticated: true,
    }
  }

  const { data: s } = await supabase
    .from("students_current")
    .select("id, email, full_name, clinic_id, clinic, client_id")
    .ilike("email", email)
    .maybeSingle()

  if (s) {
    return {
      role: "student", userId: s.id, authUserId: user.id,
      email: user.email || null, fullName: s.full_name || null,
      clinicId: s.clinic_id || null, clinicName: null,
      studentId: s.id, directorId: null, clientId: s.client_id || null,
      isLoading: false, isAuthenticated: true,
    }
  }

  const { data: c } = await supabase
    .from("clients_current")
    .select("id, name, email")
    .ilike("email", email)
    .maybeSingle()

  if (c) {
    return {
      role: "client", userId: c.id, authUserId: user.id,
      email: user.email || null, fullName: c.name || null,
      clinicId: null, clinicName: null,
      studentId: null, directorId: null, clientId: c.id,
      isLoading: false, isAuthenticated: true,
    }
  }

  return { ...EMPTY, userId: user.id, authUserId: user.id, email: user.email || null, isAuthenticated: true }
}

// ── Main fetch (with retry + cache fallbacks) ───────────────────────
async function fetchUserRole(): Promise<UserRoleData> {
  const supabase = createClient()

  // 1. Try getting the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user) {
    // If the error looks like a rate limit, DON'T return isAuthenticated:false.
    // Fall back to sessionStorage - the user is likely still logged in.
    if (authError) {
      const msg = (authError.message || "").toLowerCase()
      if (msg.includes("too many") || msg.includes("rate limit") || msg.includes("unexpected token")) {
        const cached = readSessionCache()
        if (cached) return cached
        // Still rate-limited but no cache - return authenticated:true to avoid redirect
        return { ...EMPTY, isAuthenticated: true }
      }
    }
    return EMPTY
  }

  // 2. Check sessionStorage cache
  const cached = readSessionCache(user.id)
  if (cached) return cached

  // 3. Query role tables (with 1 retry on rate-limit)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await fetchUserRoleOnce(supabase, user)
      writeSessionCache(result)
      return result
    } catch (err: any) {
      const msg = (err?.message || "").toLowerCase()
      const isRateLimit = msg.includes("too many") || msg.includes("rate limit") || msg.includes("unexpected token")
      if (isRateLimit && attempt === 0) {
        await new Promise((r) => setTimeout(r, 2000))
        continue
      }
      // Role lookup failed but user IS authenticated
      return { ...EMPTY, userId: user.id, authUserId: user.id, email: user.email || null, isAuthenticated: true }
    }
  }

  return { ...EMPTY, userId: user.id, authUserId: user.id, email: user.email || null, isAuthenticated: true }
}

// ── Hook ────────────────────────────────────────────────────────────
export function useUserRole(): UserRoleData {
  // Read sessionStorage synchronously so the very first render already has
  // role + isAuthenticated, avoiding the "loading flash" and false redirects.
  const [data, setData] = useState<UserRoleData>(() => {
    const cached = readSessionCache()
    if (cached) return cached
    if (globalAuthCache && Date.now() - cacheTimestamp < CACHE_TTL) return globalAuthCache
    return LOADING
  })

  useEffect(() => {
    const supabase = createClient()

    // Auth state listener - only react to real sign-in / sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        globalAuthCache = null
        globalAuthPromise = null
        cacheTimestamp = 0
        try { sessionStorage.removeItem(SS_KEY) } catch {}
        setData(EMPTY)
        return
      }

      // INITIAL_SESSION / TOKEN_REFRESHED: only refetch if we have NO cache at all
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        if (globalAuthCache || readSessionCache()) return // cache is fine, skip
      }

      // SIGNED_IN: cache the new session
      if (event === "SIGNED_IN" && session?.user) {
        if (!globalAuthPromise) {
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

    // If the initial useState already had cached data, we're done.
    if (data.isAuthenticated && data.role) {
      return () => subscription.unsubscribe()
    }

    // Otherwise kick off a fetch (reusing in-flight promise if one exists)
    if (globalAuthCache && Date.now() - cacheTimestamp < CACHE_TTL) {
      setData(globalAuthCache)
    } else if (globalAuthPromise) {
      globalAuthPromise.then((r) => setData(r))
    } else {
      globalAuthPromise = fetchUserRole()
      globalAuthPromise.then((result) => {
        globalAuthCache = result
        cacheTimestamp = Date.now()
        globalAuthPromise = null
        setData(result)
      })
    }

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return data
}

// ── Exports ─────────────────────────────────────────────────────────
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
      return "/sign-in"
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
}
