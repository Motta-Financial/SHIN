"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { clearAuthCache } from "@/hooks/use-user-role"

export default function AuthLoadingPage() {
  const router = useRouter()
  const [status, setStatus] = useState("Verifying your account...")
  const supabase = createClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await detectRoleAndRedirect(session.user.email!)
      } else if (event === "INITIAL_SESSION") {
        if (session?.user) {
          await detectRoleAndRedirect(session.user.email!)
        } else {
          router.push("/sign-in")
        }
      }
    })

    const detectRoleAndRedirect = async (userEmail: string) => {
      setStatus("Loading your profile...")

      try {
        clearAuthCache()

        // Call API route that uses service role to bypass RLS
        const response = await fetch("/api/auth/detect-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail }),
        })

        const data = await response.json()

        if (response.ok && data.redirect) {
          console.log("[v0] AuthLoading - Role detected:", data.role, "Redirecting to:", data.redirect)
          router.push(data.redirect)
          return
        }

        // No role found
        console.error("[v0] AuthLoading - No role found for:", userEmail, data.error)
        setStatus("Account not configured. Please contact support.")
        setTimeout(() => router.push("/sign-in"), 3000)
      } catch (error) {
        console.error("[v0] AuthLoading - Error:", error)
        setStatus("Error loading your account. Redirecting...")
        setTimeout(() => router.push("/sign-in"), 2000)
      }
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#1A2332]" />
        <p className="text-lg text-slate-700 font-medium">{status}</p>
      </div>
    </div>
  )
}
