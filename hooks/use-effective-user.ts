"use client"

import { useUserRole } from "@/hooks/use-user-role"
import { useViewAs } from "@/contexts/view-as-context"

/**
 * Returns the effective user identity.
 * When an admin is impersonating ("View As"), this returns the impersonated user's info.
 * Otherwise it returns the real authenticated user's info.
 *
 * Usage: Replace `useUserRole()` with `useEffectiveUser()` in pages that should
 * support admin impersonation.
 */
export function useEffectiveUser() {
  const realUser = useUserRole()
  const { viewAsUser, isViewingAs, effectiveUserId, effectiveRole, stopViewAs } = useViewAs()

  if (isViewingAs && viewAsUser) {
    return {
      // Effective (impersonated) identity
      role: viewAsUser.role as "director" | "student" | "client",
      userId: viewAsUser.userId,
      authUserId: viewAsUser.authUserId,
      email: viewAsUser.email,
      fullName: viewAsUser.name,
      clinicId: viewAsUser.clinicId || null,
      clinicName: null,
      studentId: viewAsUser.role === "student" ? viewAsUser.userId : null,
      directorId: viewAsUser.role === "director" ? viewAsUser.userId : null,
      clientId: viewAsUser.role === "client" ? viewAsUser.userId : (viewAsUser.clientId || null),

      // Auth state from real user
      isLoading: realUser.isLoading,
      isAuthenticated: realUser.isAuthenticated,

      // Admin impersonation flags
      isViewingAs: true,
      realRole: realUser.role,
      realUserId: realUser.userId,
      stopViewAs,
    }
  }

  return {
    ...realUser,
    isViewingAs: false,
    realRole: realUser.role,
    realUserId: realUser.userId,
    stopViewAs,
  }
}
