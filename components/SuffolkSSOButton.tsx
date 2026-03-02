"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function SuffolkSSOButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSSOLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Check if user already has a valid session
      let existingEmail: string | null = null
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log("[v0] SSO btn getSession result:", session?.user?.email || "NO SESSION", "expires:", session?.expires_at)
        if (session?.user?.email) existingEmail = session.user.email
      } catch (e) {
        console.log("[v0] SSO btn getSession error:", e)
      }
      if (!existingEmail) {
        try {
          const { data: { user }, error: userErr } = await supabase.auth.getUser()
          console.log("[v0] SSO btn getUser result:", user?.email || "NO USER", "error:", userErr?.message)
          if (user?.email) existingEmail = user.email
        } catch (e) {
          console.log("[v0] SSO btn getUser error:", e)
        }
      }

      console.log("[v0] SSO btn final existingEmail:", existingEmail)

      if (existingEmail) {
        // Already authenticated -- redirect directly, do NOT re-initiate SSO
        console.log("[v0] SSO btn: user already authenticated, calling detect-role")
        try {
          const res = await fetch("/api/auth/detect-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: existingEmail }),
          })
          const data = await res.json().catch(() => null)
          console.log("[v0] SSO btn detect-role response:", res.status, data)
          if (res.ok && data?.redirect) {
            console.log("[v0] SSO btn: redirecting to", data.redirect)
            window.location.href = data.redirect
            return
          }
        } catch (e) {
          console.log("[v0] SSO btn detect-role error:", e)
        }
        console.log("[v0] SSO btn: falling back to /auth/loading")
        window.location.href = "/auth/loading"
        return
      }

      // No valid session -- initiate fresh SSO flow
      console.log("[v0] SSO btn: no session, initiating SSO")
      const { data: ssoData, error: ssoError } = await supabase.auth.signInWithSSO({
        domain: "suffolk.edu",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      console.log("[v0] SSO btn signInWithSSO result:", ssoData, "error:", ssoError?.message)

      if (ssoError) {
        setError(ssoError.message)
        setIsLoading(false)
      }
    } catch (e) {
      console.log("[v0] SSO btn catch error:", e)
      setError("Failed to initiate SSO login. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className="w-full bg-[#1A2332] text-white hover:bg-[#152347] border-none"
        onClick={handleSSOLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirecting to Suffolk SSO...
          </>
        ) : (
          "Admin Sign In"
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  )
}
