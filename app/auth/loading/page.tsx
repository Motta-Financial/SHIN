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

    const handleAuth = async () => {
      const supabase = createClient()

      try {
        // Step 1: Let createBrowserClient auto-detect ?code= in the URL
        // and exchange it for a session using the PKCE code_verifier
        // that's stored in browser cookies. We listen for the auth
        // state change to know when the exchange completes.
        // Check for SAML error redirect
        const urlParams = new URLSearchParams(window.location.search)
        const authError = urlParams.get("error") || urlParams.get("error_description")
        if (authError) {
          window.history.replaceState({}, "", "/auth/loading")
          setStatus("Sign in failed. Redirecting...")
          setTimeout(() => router.push(`/sign-in?error=${encodeURIComponent(authError)}`), 1500)
          return
        }

        const hasCode = urlParams.has("code")

        if (hasCode) {
          setStatus("Completing sign in...")
          // The browser client's detectSessionInUrl: true handles
          // the code exchange automatically. We wait for it by
          // listening to the auth state change event.
          const session = await new Promise<any>((resolve) => {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
              (event, session) => {
                if (event === "SIGNED_IN" && session) {
                  subscription.unsubscribe()
                  resolve(session)
                }
                if (event === "TOKEN_REFRESHED" && session) {
                  subscription.unsubscribe()
                  resolve(session)
                }
              }
            )
            // Also try a direct exchange as a fallback
            const url = new URL(window.location.href)
            const code = url.searchParams.get("code")
            if (code) {
              supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
                if (data?.session) {
                  subscription.unsubscribe()
                  resolve(data.session)
                }
                if (error) {
                  subscription.unsubscribe()
                  resolve(null)
                }
              })
            }
            // Timeout after 10 seconds
            setTimeout(() => {
              subscription.unsubscribe()
              resolve(null)
            }, 10000)
          })

          // Clean the URL
          window.history.replaceState({}, "", "/auth/loading")

          if (!session) {
            setStatus("Sign in failed. Redirecting...")
            setTimeout(() => router.push("/sign-in?error=Code+exchange+failed"), 1500)
            return
          }
        }

        // Step 2: Check sessionStorage cache (fastest path for return visits)
        try {
          const cached = sessionStorage.getItem("shin_role_cache")
          if (cached) {
            const parsed = JSON.parse(cached)
            if (parsed.role && Date.now() - parsed.timestamp < 300000) {
              setStatus("Loading your profile...")
              if (parsed.role === "admin") { router.push("/admin"); return }
              if (parsed.role === "director") { router.push("/director"); return }
              if (parsed.role === "student") { router.push("/students"); return }
              if (parsed.role === "client") { router.push("/client-portal"); return }
            }
          }
        } catch {}

        // Step 3: Get user email from Supabase session
        let userEmail: string | null = null
        let userId: string | null = null

        const { data: sessionData } = await supabase.auth.getSession()
        userEmail = sessionData.session?.user?.email || null
        userId = sessionData.session?.user?.id || null

        if (!userEmail) {
          const { data: userData } = await supabase.auth.getUser()
          userEmail = userData.user?.email || null
          userId = userData.user?.id || null
        }

        if (!userEmail) {
          setStatus("No valid session found. Redirecting...")
          setTimeout(() => router.push("/sign-in"), 1500)
          return
        }

        setStatus("Loading your profile...")
        clearAuthCache()

        // Step 4: Detect role and redirect
        const response = await fetch("/api/auth/detect-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail }),
        })

        let data: any = null
        try {
          const text = await response.text()
          data = JSON.parse(text)
        } catch {
          setStatus("Server is busy. Please try again.")
          setTimeout(() => router.push("/sign-in"), 2000)
          return
        }

        if (response.ok && data?.redirect) {
          try {
            sessionStorage.setItem("shin_role_cache", JSON.stringify({
              role: data.role,
              userId: data.userId,
              authUserId: userId || "",
              email: userEmail,
              userName: data.userName,
              clinicId: data.clinicId || null,
              studentId: data.role === "student" ? data.userId : null,
              directorId: data.role === "director" ? data.userId : null,
              clientId: data.role === "client" ? data.userId : null,
              timestamp: Date.now(),
            }))
          } catch {}
          router.push(data.redirect)
          return
        }

        setStatus(`No account found for ${userEmail}. Please contact support.`)
        setTimeout(() => router.push("/sign-in"), 4000)
      } catch (error) {
        console.error("AuthLoading - Error:", error)
        setStatus("Error loading your account. Redirecting...")
        setTimeout(() => router.push("/sign-in"), 2000)
      }
    }

    handleAuth()
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
