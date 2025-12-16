"use client"

import type React from "react"

import { useHasRole } from "@/lib/supabase/hooks"
import type { UserRole } from "@/lib/supabase/auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldX } from "lucide-react"

interface RoleGateProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallback?: React.ReactNode
}

export function RoleGate({ children, allowedRoles, fallback }: RoleGateProps) {
  const hasAccess = useHasRole(allowedRoles)

  if (!hasAccess) {
    return (
      fallback || (
        <Alert variant="destructive">
          <ShieldX className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don&apos;t have permission to access this content. Required role:{" "}
            {allowedRoles.map((r) => r).join(", ")}
          </AlertDescription>
        </Alert>
      )
    )
  }

  return <>{children}</>
}
