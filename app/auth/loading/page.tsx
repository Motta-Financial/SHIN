"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { clearAuthCache } from "@/hooks/use-user-role"

export default function AuthLoadingPage() {
  const router = useRouter()
  const [status, setStatus] = useState("Verifying your account...")
  const hasStartedRef = useRef(false)

  useEffect(() => {
    // Prevent double execution
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    const detectRoleAndRedirect = async () => {
      console.log("[v0] AuthLoading - Starting role detection")

      try {
        const supabase = createClient()

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        console.log("[v0] AuthLoading - User check:", { hasUser: !!user, error: userError?.message })

        if (userError || !user) {
          console.log("[v0] AuthLoading - No user found, redirecting to sign-in")
          router.push("/sign-in")
          return
        }

        setStatus("Loading your profile...")
        clearAuthCache()

        // Call API route that uses service role to bypass RLS
        console.log("[v0] AuthLoading - Calling detect-role API for:", user.email)

        const response = await fetch("/api/auth/detect-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        })

        console.log("[v0] AuthLoading - API response status:", response.status)

        const data = await response.json()
        console.log("[v0] AuthLoading - API response data:", data)

        if (response.ok && data.redirect) {
          console.log("[v0] AuthLoading - Role detected:", data.role, "Redirecting to:", data.redirect)
          router.push(data.redirect)
          return
        }

        // No role found
        console.error("[v0] AuthLoading - No role found for:", user.email, data.error)
        setStatus("Account not configured. Please contact support.")
        setTimeout(() => router.push("/sign-in"), 3000)
      } catch (error) {
        console.error("[v0] AuthLoading - Error:", error)
        setStatus("Error loading your account. Redirecting...")
        setTimeout(() => router.push("/sign-in"), 2000)
      }
    }

    detectRoleAndRedirect()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#1A2332]" />
        <p className="text-lg text-slate-700 font-medium">{status}</p>
      </div>
    </div>
  )
}
