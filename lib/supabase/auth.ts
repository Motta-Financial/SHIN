import { createClient } from "@/utils/supabase/server"

export type UserRole = "admin" | "director" | "client" | "student"

export interface UserProfile {
  id: string
  full_name: string | null
  role: UserRole | null
  is_admin: boolean
}

/**
 * Get the current authenticated user and their profile
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  // Fetch user profile from profiles table
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return {
    user,
    profile: profile as UserProfile | null,
  }
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const currentUser = await getCurrentUser()
  if (!currentUser?.profile) return false

  return currentUser.profile.role === role || currentUser.profile.is_admin === true
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const currentUser = await getCurrentUser()
  return currentUser?.profile?.is_admin === true
}

/**
 * Get user-specific data based on their role
 */
export async function getUserRoleData() {
  const supabase = await createClient()
  const currentUser = await getCurrentUser()

  if (!currentUser?.profile) return null

  const { role, id } = currentUser.profile

  switch (role) {
    case "student": {
      const { data: studentData } = await supabase.from("students").select("*").eq("user_id", id).single()
      return { role, data: studentData }
    }
    case "director": {
      const { data: directorData } = await supabase.from("directors").select("*").eq("id", id).single()
      return { role, data: directorData }
    }
    case "client": {
      const { data: clientData } = await supabase.from("clients").select("*").eq("id", id).single()
      return { role, data: clientData }
    }
    case "admin":
      return { role, data: null }
    default:
      return null
  }
}
