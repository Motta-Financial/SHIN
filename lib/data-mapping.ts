/**
 * ============================================================================
 * FOUNDATIONAL DATA MAPPING LAYER - LOCKED
 * ============================================================================
 *
 * PRIMARY SOURCE OF TRUTH: v_complete_mapping
 *
 * This view links ALL core entities via UUIDs (not text):
 * - Students (student_id, student_name, student_email)
 * - Clinics (student_clinic_id, student_clinic_name)
 * - Clients (client_id, client_name)
 * - Clinic Directors (clinic_director_id, clinic_director_name, clinic_director_email)
 * - Client Directors (client_director_id, client_director_name, client_director_email)
 * - Semester
 *
 * ALL FILTERING MUST USE IDs, NOT TEXT MATCHING
 * Text fields are for DISPLAY ONLY
 *
 * DO NOT MODIFY THIS FILE when making app changes.
 * All components MUST use these functions for data fetching.
 * This mapping is LOCKED and consistent across the entire application.
 * ============================================================================
 */

import { createClient } from "@/lib/supabase/client"

// =============================================================================
// LOCKED TYPES - Based on v_complete_mapping view
// =============================================================================

/**
 * PRIMARY TYPE - From v_complete_mapping view
 * This is the LOCKED structure that links everything together
 * ALL IDs are UUIDs for proper foreign key relationships
 */
export interface CompleteMapping {
  // Student info
  student_id: string
  student_name: string
  student_email: string

  // Student's Clinic (via clinic_students)
  student_clinic_id: string | null
  student_clinic_name: string | null

  // Student's Client (via client_assignments)
  client_id: string | null
  client_name: string | null
  student_role: string | null

  // Clinic Director (via clinic_directors)
  clinic_director_id: string | null
  clinic_director_name: string | null
  clinic_director_email: string | null

  // Client Primary Director (via clients.primary_director_id)
  client_director_id: string | null
  client_director_name: string | null
  client_director_email: string | null

  // Semester
  semester: string | null

  // Client status
  client_status: string | null
}

/**
 * Debrief type - linked to students via student_id (UUID)
 */
export interface Debrief {
  id: string
  student_id: string
  student_name: string
  student_email: string
  client_name: string
  clinic: string
  hours_worked: number
  work_summary: string
  questions: string
  week_ending: string
  week_number: number
  date_submitted: string
  status: string
  semester: string
}

/**
 * Director type
 */
export interface Director {
  id: string
  full_name: string
  email: string
  clinic: string
  clinic_id: string | null
  job_title: string | null
  role: string | null
  semester: string | null
}

/**
 * Client type
 */
export interface Client {
  id: string
  name: string
  email: string
  contact_name: string
  website: string
  project_type: string
  status: string
  semester: string
  alumni_mentor: string
  primary_director_id: string
}

// =============================================================================
// LOCKED CORE FUNCTIONS - DO NOT MODIFY
// =============================================================================

/**
 * PRIMARY FUNCTION - Get all data from v_complete_mapping
 * This is the FOUNDATION for all other data operations
 */
export async function getCompleteMapping(): Promise<CompleteMapping[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("v_complete_mapping").select("*")

  if (error) {
    console.error("[DataMapping] Error fetching v_complete_mapping:", error)
    return []
  }
  return data || []
}

/**
 * Get all directors from directors table
 */
export async function getDirectors(): Promise<Director[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("directors").select("*")

  if (error) {
    console.error("[DataMapping] Error fetching directors:", error)
    return []
  }
  return data || []
}

/**
 * Get all debriefs
 */
export async function getDebriefs(): Promise<Debrief[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("debriefs").select("*").order("date_submitted", { ascending: false })

  if (error) {
    console.error("[DataMapping] Error fetching debriefs:", error)
    return []
  }
  return data || []
}

/**
 * Get all clients
 */
export async function getClients(): Promise<Client[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("clients").select("*")

  if (error) {
    console.error("[DataMapping] Error fetching clients:", error)
    return []
  }
  return data || []
}

// =============================================================================
// DERIVED FUNCTIONS - Built on v_complete_mapping foundation
// ALL filtering uses IDs, not text matching
// =============================================================================

/**
 * Get a student's full profile by student_id (UUID)
 */
export async function getStudentById(studentId: string): Promise<CompleteMapping | null> {
  const mappings = await getCompleteMapping()
  return mappings.find((s) => s.student_id === studentId) || null
}

/**
 * Get a student's full profile by email (for initial lookup only)
 */
export async function getStudentByEmail(studentEmail: string): Promise<CompleteMapping | null> {
  const mappings = await getCompleteMapping()
  return mappings.find((s) => s.student_email?.toLowerCase() === studentEmail.toLowerCase()) || null
}

/**
 * Get all students in a clinic by clinic_id (UUID)
 */
export async function getStudentsByClinicId(clinicId: string): Promise<CompleteMapping[]> {
  const mappings = await getCompleteMapping()
  return mappings.filter((s) => s.student_clinic_id === clinicId)
}

/**
 * Get all students assigned to a client by client_id (UUID)
 */
export async function getStudentsByClientId(clientId: string): Promise<CompleteMapping[]> {
  const mappings = await getCompleteMapping()
  return mappings.filter((s) => s.client_id === clientId)
}

/**
 * Get all students under a clinic director by director_id (UUID)
 */
export async function getStudentsByClinicDirectorId(directorId: string): Promise<CompleteMapping[]> {
  const mappings = await getCompleteMapping()
  return mappings.filter((s) => s.clinic_director_id === directorId)
}

/**
 * Get all students under a client director by director_id (UUID)
 */
export async function getStudentsByClientDirectorId(directorId: string): Promise<CompleteMapping[]> {
  const mappings = await getCompleteMapping()
  return mappings.filter((s) => s.client_director_id === directorId)
}

/**
 * Get all students under a director (both clinic and client) by director_id (UUID)
 */
export async function getAllStudentsByDirectorId(directorId: string): Promise<CompleteMapping[]> {
  const mappings = await getCompleteMapping()
  const studentIds = new Set<string>()
  const results: CompleteMapping[] = []

  for (const m of mappings) {
    if ((m.clinic_director_id === directorId || m.client_director_id === directorId) && !studentIds.has(m.student_id)) {
      studentIds.add(m.student_id)
      results.push(m)
    }
  }
  return results
}

/**
 * Get all teammates (students with the same client) by client_id (UUID)
 */
export async function getTeammatesByClientId(clientId: string): Promise<CompleteMapping[]> {
  return getStudentsByClientId(clientId)
}

/**
 * Get debriefs for students by their student_ids (UUIDs)
 */
export async function getDebriefsByStudentIds(studentIds: string[]): Promise<Debrief[]> {
  if (studentIds.length === 0) return []
  const allDebriefs = await getDebriefs()
  return allDebriefs.filter((d) => studentIds.includes(d.student_id))
}

/**
 * Get debriefs for a clinic by clinic_id (UUID)
 */
export async function getDebriefsByClinicId(clinicId: string): Promise<Debrief[]> {
  const students = await getStudentsByClinicId(clinicId)
  const studentIds = students.map((s) => s.student_id)
  return getDebriefsByStudentIds(studentIds)
}

/**
 * Get debriefs for a director (all students under them) by director_id (UUID)
 */
export async function getDebriefsByDirectorId(directorId: string): Promise<Debrief[]> {
  const students = await getAllStudentsByDirectorId(directorId)
  const studentIds = students.map((s) => s.student_id)
  return getDebriefsByStudentIds(studentIds)
}

/**
 * Get all unique clinic IDs with their names
 */
export async function getAllClinics(): Promise<{ id: string; name: string }[]> {
  const mappings = await getCompleteMapping()
  const clinicMap = new Map<string, string>()

  for (const m of mappings) {
    if (m.student_clinic_id && m.student_clinic_name) {
      clinicMap.set(m.student_clinic_id, m.student_clinic_name)
    }
  }

  return Array.from(clinicMap.entries()).map(([id, name]) => ({ id, name }))
}

/**
 * Get all unique client IDs with their names
 */
export async function getAllClientsList(): Promise<{ id: string; name: string }[]> {
  const mappings = await getCompleteMapping()
  const clientMap = new Map<string, string>()

  for (const m of mappings) {
    if (m.client_id && m.client_name) {
      clientMap.set(m.client_id, m.client_name)
    }
  }

  return Array.from(clientMap.entries()).map(([id, name]) => ({ id, name }))
}

// =============================================================================
// LEGACY COMPATIBILITY - For gradual migration
// These wrap the new ID-based functions but accept text for backward compatibility
// =============================================================================

/** @deprecated Use getStudentByEmail instead */
export async function getStudentProfile(studentEmail: string): Promise<CompleteMapping | null> {
  return getStudentByEmail(studentEmail)
}

/** @deprecated Use getCompleteMapping instead */
export async function getStudentOverviews(): Promise<CompleteMapping[]> {
  return getCompleteMapping()
}
