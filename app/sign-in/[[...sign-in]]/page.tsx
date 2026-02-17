"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff } from "lucide-react"
import SuffolkSSOButton from "@/components/SuffolkSSOButton"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setIsLoading(false)
        return
      }

      if (!data.user || !data.session) {
        setError("Authentication failed. Please try again.")
        setIsLoading(false)
        return
      }

      // Detect role and redirect - single attempt, no retries for speed
      const userEmail = data.user.email
      try {
        const roleRes = await fetch("/api/auth/detect-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail }),
        })
        const roleText = await roleRes.text()
        let roleData: any = null
        try { roleData = JSON.parse(roleText) } catch {}

        // Cache the role data in sessionStorage so useUserRole reads it instantly
        if (roleData?.role) {
          try {
            sessionStorage.setItem("shin_role_cache", JSON.stringify({
              role: roleData.role,
              userId: roleData.userId,
              authUserId: data.user.id,
              email: userEmail,
              userName: roleData.userName,
              clinicId: roleData.clinicId || null,
              studentId: roleData.role === "student" ? roleData.userId : null,
              directorId: roleData.role === "director" ? roleData.userId : null,
              clientId: roleData.role === "client" ? roleData.userId : null,
              timestamp: Date.now(),
            }))
          } catch {}
        }

        // Use router.push for instant client-side navigation (no black screen).
        // The sessionStorage cache written above ensures useUserRole resolves
        // synchronously on the target page, so the user sees their dashboard
        // immediately with no loading flash.
        if (roleData?.role === "admin") {
          router.push("/admin")
        } else if (roleData?.role === "director") {
          router.push("/director")
        } else if (roleData?.role === "student") {
          router.push("/students")
        } else if (roleData?.role === "client") {
          router.push("/client-portal")
        } else {
          router.push("/auth/loading")
        }
      } catch {
        router.push("/auth/loading")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 flex flex-col items-center gap-6">
          <div className="relative w-[360px] h-[100px]">
            <Image
              src="/images/u101224-suffolk-seed-logo-chosen-recreat-1.avif"
              alt="Suffolk SEED Program"
              fill
              className="object-contain drop-shadow-md"
              priority
              unoptimized
            />
          </div>

          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-slate-300"></div>
            <span className="text-slate-500 text-sm font-medium">powered by</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-300 to-slate-300"></div>
          </div>

          <div className="relative w-[420px] h-[240px]">
            <Image
              src="/images/shin.png"
              alt="SHIN - SEED Hub & Information Nexus"
              fill
              className="object-contain drop-shadow-lg"
              priority
              unoptimized
            />
          </div>
        </div>

        <div className="mb-6 text-center">
          <p className="text-slate-700 text-lg font-medium">Dashboard Sign In</p>
        </div>

        <SuffolkSSOButton />

        <div className="flex items-center gap-3 my-5 w-full">
          <div className="flex-1 h-px bg-slate-300"></div>
          <span className="text-[#1A2332] text-sm font-medium">or</span>
          <div className="flex-1 h-px bg-slate-300"></div>
        </div>

        <Card className="shadow-xl border border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">Welcome back</CardTitle>
            <CardDescription className="text-slate-600">Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-[#1A2332] hover:bg-[#2A3342]" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Client Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>


      </div>
    </div>
  )
}
