"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function SuffolkSSOButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSSOLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
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
        variant="outline"
        className="w-full border-[#1A2332] text-[#1A2332] hover:bg-[#1A2332] hover:text-white"
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
