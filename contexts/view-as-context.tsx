"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useUserRole } from "@/hooks/use-user-role"

interface ViewAsTarget {
  userId: string
  authUserId: string
  email: string
  name: string
  role: "director" | "student" | "client"
  clinicId?: string | null
  clientId?: string | null
}

interface ViewAsContextType {
  /** The user being impersonated, or null if not impersonating */
  viewAsUser: ViewAsTarget | null
  /** Whether the current admin is impersonating someone */
  isViewingAs: boolean
  /** Start impersonating a user */
  startViewAs: (target: ViewAsTarget) => void
  /** Stop impersonating and return to admin dashboard */
  stopViewAs: () => void
  /** Get the effective user ID to use in API calls (impersonated or real) */
  effectiveUserId: string | null
  /** Get the effective role (impersonated or real) */
  effectiveRole: string | null
}

const ViewAsContext = createContext<ViewAsContextType>({
  viewAsUser: null,
  isViewingAs: false,
  startViewAs: () => {},
  stopViewAs: () => {},
  effectiveUserId: null,
  effectiveRole: null,
})

const SS_VIEW_AS_KEY = "shin_view_as"

export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  const { role, userId } = useUserRole()
  const [viewAsUser, setViewAsUser] = useState<ViewAsTarget | null>(null)

  // Read from sessionStorage on mount
  useEffect(() => {
    if (role !== "admin") {
      // Clear any stale impersonation data if not admin
      try { sessionStorage.removeItem(SS_VIEW_AS_KEY) } catch {}
      setViewAsUser(null)
      return
    }

    try {
      const stored = sessionStorage.getItem(SS_VIEW_AS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Only valid for 4 hours
        if (Date.now() - parsed.timestamp < 4 * 60 * 60 * 1000) {
          setViewAsUser(parsed)
        } else {
          sessionStorage.removeItem(SS_VIEW_AS_KEY)
        }
      }
    } catch {}
  }, [role])

  const startViewAs = useCallback((target: ViewAsTarget) => {
    const withTimestamp = { ...target, timestamp: Date.now() }
    sessionStorage.setItem(SS_VIEW_AS_KEY, JSON.stringify(withTimestamp))
    setViewAsUser(target)
  }, [])

  const stopViewAs = useCallback(() => {
    sessionStorage.removeItem(SS_VIEW_AS_KEY)
    setViewAsUser(null)
  }, [])

  const isViewingAs = role === "admin" && viewAsUser !== null

  const effectiveUserId = isViewingAs ? viewAsUser!.userId : userId
  const effectiveRole = isViewingAs ? viewAsUser!.role : role

  return (
    <ViewAsContext.Provider
      value={{
        viewAsUser,
        isViewingAs,
        startViewAs,
        stopViewAs,
        effectiveUserId,
        effectiveRole,
      }}
    >
      {children}
    </ViewAsContext.Provider>
  )
}

export function useViewAs() {
  return useContext(ViewAsContext)
}
