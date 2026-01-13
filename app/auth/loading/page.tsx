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

        const normalizedEmail = userEmail.toLowerCase()

        // Check directors first
        const { data: directorData, error: directorError } = await supabase
          .from("directors")
          .select("id, email, role, full_name")
          .eq("email", normalizedEmail)
          .maybeSingle()

        if (directorData) {
          router.push("/director")
          return
        }

        // Check students
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id, email, full_name, clinic")
          .eq("email", normalizedEmail)
          .maybeSingle()

        if (studentData) {
          router.push("/students")
          return
        }

        // Check clients
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("id, name, email")
          .eq("email", normalizedEmail)
          .maybeSingle()

        if (clientData) {
          router.push("/client-portal")
          return
        }

        // No role found - try case-insensitive search as fallback
        const { data: allStudents } = await supabase.from("students").select("id, email, full_name, clinic")

        const matchingStudent = allStudents?.find((s) => s.email?.toLowerCase() === normalizedEmail)

        if (matchingStudent) {
          router.push("/students")
          return
        }

        // No role found
        setStatus("Account not configured. Please contact support.")
        setTimeout(() => router.push("/sign-in"), 3000)
      } catch (error) {
        console.error("[v0] AuthLoading - Query error:", error)
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
