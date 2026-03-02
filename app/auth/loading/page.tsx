"use client"

import { Suspense, useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { clearAuthCache } from "@/hooks/use-user-role"

function AuthLoadingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState("Verifying your account...")
  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    const handleAuth = async () => {
      const supabase = createClient()
      const code = searchParams.get("code")

      try {
        // Step 1: If we have a code from the callback, exchange it for a session
        // This MUST happen client-side where the PKCE code_verifier is stored
        if (code) {
          setStatus("Completing sign in...")
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            console.error("Code exchange error:", exchangeError.message)
            setStatus("Sign in failed. Redirecting...")
            setTimeout(() => router.push(`/sign-in?error=${encodeURIComponent(exchangeError.message)}`), 2000)
            return
          }
          // Clean the URL (remove code param)
          window.history.replaceState({}, "", "/auth/loading")
        }

        // Step 2: Check sessionStorage cache (fastest path)
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
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#1A2332]" />
        <p className="text-lg text-slate-700 font-medium">{status}</p>
      </div>
    </div>
  )
}

export default function AuthLoadingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <Loader2 className="h-12 w-12 animate-spin text-[#1A2332]" />
      </div>
    }>
      <AuthLoadingContent />
    </Suspense>
  )
}
