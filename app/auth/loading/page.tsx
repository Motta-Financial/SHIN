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
        // 1. Check sessionStorage cache first (written by sign-in page)
        //    This is the fastest path and avoids Supabase calls entirely
        if (typeof window !== "undefined") {
          try {
            const cached = sessionStorage.getItem("shin_role_cache")
            if (cached) {
              const parsed = JSON.parse(cached)
              if (parsed.role && Date.now() - parsed.timestamp < 300000) {
                setStatus("Loading your profile...")
                if (parsed.role === "director") { router.push("/director"); return }
                if (parsed.role === "student") { router.push("/students"); return }
                if (parsed.role === "client") { router.push("/client-portal"); return }
              }
            }
          } catch {}
        }

        // 2. No cache - try to get user email from Supabase session
        const supabase = createClient()
        let userEmail: string | null = null

        // Try getSession first (reads from local storage, no network call)
        const { data: sessionData } = await supabase.auth.getSession()
        userEmail = sessionData.session?.user?.email || null

        // Fallback to getUser (network call to Supabase)
        if (!userEmail) {
          const { data: userData } = await supabase.auth.getUser()
          userEmail = userData.user?.email || null
        }

        if (!userEmail) {
          router.push("/sign-in")
          return
        }

        setStatus("Loading your profile...")
        clearAuthCache()

        // 3. Call detect-role with the validated email
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
          // Cache for future use
          try {
            sessionStorage.setItem("shin_role_cache", JSON.stringify({
              role: data.role,
              userId: data.userId,
              authUserId: sessionData.session?.user?.id || "",
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
