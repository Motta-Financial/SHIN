// Centralized semester management
// This utility provides the current semester ID from app_settings
// instead of hardcoding "a1b2c3d4-e5f6-7890-abcd-202601120000" everywhere

import { createClient } from "@/lib/supabase/server"

// Cache for current semester (server-side)
let cachedSemesterId: string | null = null
let cachedSemesterName: string | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 60 * 1000 // 1 minute cache

// Fallback for when app_settings isn't available
const FALLBACK_SEMESTER_ID = "a1b2c3d4-e5f6-7890-abcd-202601120000"
const FALLBACK_SEMESTER_NAME = "Spring 2026"

/**
 * Get the current semester ID from app_settings
 * This should be used in server-side code (API routes, server components)
 */
export async function getCurrentSemesterId(): Promise<string> {
  const now = Date.now()
  
  // Return cached value if still valid
  if (cachedSemesterId && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedSemesterId
  }
  
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("app_settings")
      .select("current_semester_id")
      .single()
    
    if (error || !data?.current_semester_id) {
      console.warn("[semester] Failed to fetch current semester, using fallback:", error?.message)
      return FALLBACK_SEMESTER_ID
    }
    
    cachedSemesterId = data.current_semester_id
    cacheTimestamp = now
    
    return cachedSemesterId
  } catch (error) {
    console.error("[semester] Error fetching current semester:", error)
    return FALLBACK_SEMESTER_ID
  }
}

/**
 * Get the current semester details (ID and name)
 */
export async function getCurrentSemester(): Promise<{ id: string; name: string }> {
  try {
    const supabase = await createClient()
    
    const { data: settings, error: settingsError } = await supabase
      .from("app_settings")
      .select("current_semester_id")
      .single()
    
    if (settingsError || !settings?.current_semester_id) {
      return { id: FALLBACK_SEMESTER_ID, name: FALLBACK_SEMESTER_NAME }
    }
    
    const { data: semester, error: semesterError } = await supabase
      .from("semesters")
      .select("id, name")
      .eq("id", settings.current_semester_id)
      .single()
    
    if (semesterError || !semester) {
      return { id: settings.current_semester_id, name: FALLBACK_SEMESTER_NAME }
    }
    
    return { id: semester.id, name: semester.name }
  } catch (error) {
    console.error("[semester] Error fetching current semester details:", error)
    return { id: FALLBACK_SEMESTER_ID, name: FALLBACK_SEMESTER_NAME }
  }
}

/**
 * Clear the semester cache (useful after semester changes)
 */
export function clearSemesterCache(): void {
  cachedSemesterId = null
  cachedSemesterName = null
  cacheTimestamp = 0
}
