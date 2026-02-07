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
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    const detectRoleAndRedirect = async () => {
      try {
        const supabase = createClient()

        // Try multiple times to find the session - cookies may take a moment to sync
        let user = null
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt > 0) {
            await new Promise((r) => setTimeout(r, 1000))
          }

          const { data: sessionData } = await supabase.auth.getSession()
          user = sessionData.session?.user

          if (!user) {
            const { data: userData } = await supabase.auth.getUser()
            user = userData.user
          }

          if (user) break
        }

        if (!user) {
          router.push("/sign-in")
          return
        }

        setStatus("Loading your profile...")
        clearAuthCache()

        const userEmail = user.email
        

        let data: any = null
        let response: Response | null = null
        
        // Retry detect-role up to 3 times in case of rate limiting
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt > 0) {
            setStatus("Retrying... please wait")
            await new Promise((r) => setTimeout(r, attempt * 3000))
          }
          
          response = await fetch("/api/auth/detect-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userEmail }),
            credentials: "include",
          })

          const responseText = await response.text()

          try {
            data = JSON.parse(responseText)
            break // Success - exit retry loop
          } catch (parseError) {
            // Rate limited or server error - body isn't JSON
            if (attempt < 2) continue
            setStatus("Server is busy. Please try again.")
            setTimeout(() => router.push("/sign-in"), 2000)
            return
          }
        }
        
        if (!data || !response) {
          setStatus("Server error. Please try again.")
          setTimeout(() => router.push("/sign-in"), 2000)
          return
        }

        if (response.ok && data.redirect) {
          router.push(data.redirect)
          return
        }

        console.error("AuthLoading - No role found. Status:", response.status, "Error:", data.error, "Debug:", data.debug)
        
        // Show more helpful error message based on the error type
        if (response.status === 500) {
          setStatus("Server configuration error. Please try again later.")
        } else if (response.status === 404) {
          setStatus(`No account found for ${userEmail}. Please contact support.`)
        } else {
          setStatus("Account not configured. Please contact support.")
        }
        setTimeout(() => router.push("/sign-in"), 4000)
      } catch (error) {
        console.error("AuthLoading - Error:", error)
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
