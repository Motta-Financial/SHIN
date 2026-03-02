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
        if (session?.user?.email) existingEmail = session.user.email
      } catch {}
      if (!existingEmail) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.email) existingEmail = user.email
        } catch {}
      }

      if (existingEmail) {
        // Already authenticated -- redirect directly, do NOT re-initiate SSO
        try {
          const res = await fetch("/api/auth/detect-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: existingEmail }),
          })
          if (res.ok) {
            const data = await res.json().catch(() => null)
            if (data?.redirect) {
              router.push(data.redirect)
              return
            }
          }
        } catch {}
        router.push("/auth/loading")
        return
      }

      // No valid session -- initiate fresh SSO flow
      const { error: ssoError } = await supabase.auth.signInWithSSO({
        domain: "suffolk.edu",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (ssoError) {
        setError(ssoError.message)
        setIsLoading(false)
      }
    } catch {
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
