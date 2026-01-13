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

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        console.log("[v0] AuthLoading - Session check:", {
          hasSession: !!sessionData.session,
          email: sessionData.session?.user?.email,
          error: sessionError?.message,
        })

        // If no session, try to get user directly (session might be in cookies)
        let user = sessionData.session?.user

        if (!user) {
          console.log("[v0] AuthLoading - No session, trying getUser...")
          const { data: userData, error: userError } = await supabase.auth.getUser()

          if (userError) {
            console.log("[v0] AuthLoading - getUser error:", userError.message)
          } else {
            user = userData.user
          }
        }

        if (!user) {
          console.log("[v0] AuthLoading - No user found, redirecting to sign-in")
          router.push("/sign-in")
          return
        }

        setStatus("Loading your profile...")
        clearAuthCache()

        const userEmail = user.email
        console.log("[v0] AuthLoading - User email:", userEmail)

        console.log("[v0] AuthLoading - Calling detect-role API...")

        const response = await fetch("/api/auth/detect-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail }),
          credentials: "include",
        })

        console.log("[v0] AuthLoading - API response status:", response.status)

        const responseText = await response.text()
        console.log("[v0] AuthLoading - API response:", responseText.substring(0, 500))

        let data: any
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error("[v0] AuthLoading - Failed to parse response")
          setStatus("Server error. Please try again.")
          setTimeout(() => router.push("/sign-in"), 2000)
          return
        }

        console.log("[v0] AuthLoading - Parsed data:", data)

        if (response.ok && data.redirect) {
          console.log("[v0] AuthLoading - Redirecting to:", data.redirect)
          router.push(data.redirect)
          return
        }

        // No role found
        console.error("[v0] AuthLoading - No role found. Error:", data.error)
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
