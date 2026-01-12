"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import Image from "next/image"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const router = useRouter()

  const supabase = createClient()

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      console.log("[v0] SignIn - Checking existing session...")
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        console.log("[v0] SignIn - User already logged in:", session.user.email)
        const role = session.user.user_metadata?.role
        redirectByRole(role)
      } else {
        console.log("[v0] SignIn - No existing session")
        setIsCheckingSession(false)
      }
    }

    checkSession()
  }, [supabase])

  const redirectByRole = (role: string | undefined) => {
    let redirectUrl = "/"

    if (role === "client") {
      redirectUrl = "/client-portal"
    } else if (role === "student") {
      redirectUrl = "/students"
    } else if (role === "director" || role === "admin") {
      redirectUrl = "/director"
    }

    console.log("[v0] SignIn - Redirecting to:", redirectUrl)
    // Use window.location for a full page navigation to ensure session is recognized
    window.location.href = redirectUrl
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    console.log("[v0] SignIn - Attempting sign in for:", email)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.log("[v0] SignIn - Error:", error.message)
        setError(error.message)
        setIsLoading(false)
        return
      }

      if (data.user) {
        console.log("[v0] SignIn - Success! User:", data.user.email, "Role:", data.user.user_metadata?.role)
        const role = data.user.user_metadata?.role
        redirectByRole(role)
        // Don't setIsLoading(false) here - let the redirect complete
      }
    } catch (err) {
      console.log("[v0] SignIn - Unexpected error:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-600" />
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 flex flex-col items-center gap-6">
          {/* SEED Program Logo */}
          <div className="relative w-[360px] h-[130px]">
            <Image
              src="/images/u101224-suffolk-seed-logo-chosen-recreat-1.avif"
              alt="Suffolk SEED Program"
              fill
              className="object-contain drop-shadow-md"
              priority
            />
          </div>

          {/* Divider text */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-slate-300"></div>
            <span className="text-slate-500 text-sm font-medium">powered by</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-300 to-slate-300"></div>
          </div>

          {/* SHIN Platform Logo */}
          <div className="relative w-[420px] h-[240px]">
            <Image
              src="/images/shin.png"
              alt="SHIN - SEED Hub & Information Nexus"
              fill
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
        </div>

        <div className="mb-8 text-center">
          <p className="text-slate-700 text-lg font-medium">Dashboard Sign In</p>
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
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full bg-[#1A2332] hover:bg-[#2A3342]" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
