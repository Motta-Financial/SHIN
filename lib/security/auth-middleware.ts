import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      authorized: false,
      user: null,
      profile: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return { authorized: true, user, profile, error: null }
}

export async function requireRole(allowedRoles: string[]) {
  const { authorized, user, profile, error } = await requireAuth()

  if (!authorized || !profile) {
    return {
      authorized: false,
      user: null,
      profile: null,
      error: error || NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const hasRole = allowedRoles.includes(profile.role) || profile.is_admin

  if (!hasRole) {
    return {
      authorized: false,
      user,
      profile,
      error: NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 }),
    }
  }

  return { authorized: true, user, profile, error: null }
}

export async function requireAdmin() {
  const { authorized, user, profile, error } = await requireAuth()

  if (!authorized || !profile) {
    return {
      authorized: false,
      user: null,
      profile: null,
      error: error || NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  if (!profile.is_admin) {
    return {
      authorized: false,
      user,
      profile,
      error: NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 }),
    }
  }

  return { authorized: true, user, profile, error: null }
}
