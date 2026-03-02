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

      // First check if user already has a valid session (Duo remembered them)
      // Try both getSession (fast, local) and getUser (server-validated)
      let existingEmail: string | null = null

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.email) {
          existingEmail = session.user.email
        }
      } catch {}

      if (!existingEmail) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.email) {
            existingEmail = user.email
          }
        } catch {}
      }

      if (existingEmail) {
        // Already authenticated -- detect role and redirect directly
        // Do NOT initiate a new SSO flow (SAML assertion will be rejected)
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

        // If detect-role fails but we know user is authenticated,
        // send them to auth/loading which handles role detection client-side
        router.push("/auth/loading")
        return
      }

      // No existing session -- initiate SSO flow
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
          "Director / Student Sign In"
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  )
}
