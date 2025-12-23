/**
 * ============================================================================
 * FOUNDATIONAL DATA MAPPING LAYER - SERVER SIDE - LOCKED
 * ============================================================================
 *
 * PRIMARY SOURCE OF TRUTH: v_student_overview
 *
 * This view links ALL core entities:
 * - Students (student_id, student_name, student_email)
 * - Clients (client_name)
 * - Clinics (clinic)
 * - Directors (clinic_director, clinic_director_email, client_director, client_director_email)
 * - Semester
 *
 * DO NOT MODIFY THIS FILE when making app changes.
 * All API routes MUST use these functions for data fetching.
 * This mapping is LOCKED and consistent across the entire application.
 * ============================================================================
 */

import { createClient } from "@/lib/supabase/server"

// =============================================================================
// LOCKED TYPES - Based on v_student_overview view
// =============================================================================

/**
 * PRIMARY TYPE - From v_student_overview view
 * This is the LOCKED structure that links everything together
 */
export interface StudentOverview {
  student_id: string
  student_name: string
  student_email: string
  client_name: string
  clinic: string
  clinic_director: string
  clinic_director_email: string
  client_director: string
  client_director_email: string
  client_primary_director_id: string
  semester: string
}

/**
 * Debrief type - linked to students via student_email
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

// =============================================================================
// LOCKED CORE FUNCTIONS - DO NOT MODIFY
// =============================================================================

/**
 * PRIMARY FUNCTION - Get all data from v_student_overview
 * This is the FOUNDATION for all other data operations
 */
export async function getStudentOverviews(): Promise<StudentOverview[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("v_student_overview").select("*")

  if (error) {
    console.error("[DataMapping] Error fetching v_student_overview:", error)
    return []
  }
  return data || []
}

/**
 * Get all debriefs
 */
export async function getDebriefs(): Promise<Debrief[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("debriefs").select("*").order("date_submitted", { ascending: false })

  if (error) {
    console.error("[DataMapping] Error fetching debriefs:", error)
    return []
  }
  return data || []
}

// =============================================================================
// DERIVED FUNCTIONS - Built on v_student_overview foundation
// =============================================================================

/**
 * Get a student's full profile with linked data
 */
export async function getStudentProfile(studentEmail: string): Promise<StudentOverview | null> {
  const overviews = await getStudentOverviews()
  return overviews.find((s) => s.student_email?.toLowerCase() === studentEmail.toLowerCase()) || null
}

/**
 * Get all students working with the same client (teammates)
 */
export async function getTeammates(studentEmail: string): Promise<StudentOverview[]> {
  const student = await getStudentProfile(studentEmail)
  if (!student) return []

  const overviews = await getStudentOverviews()
  return overviews.filter((s) => s.client_name === student.client_name)
}

/**
 * Get all debriefs for a student's team
 */
export async function getTeamDebriefs(studentEmail: string): Promise<Debrief[]> {
  const teammates = await getTeammates(studentEmail)
  if (teammates.length === 0) return []

  const teammateEmails = teammates.map((t) => t.student_email)
  const allDebriefs = await getDebriefs()

  return allDebriefs.filter((d) => teammateEmails.includes(d.student_email))
}

/**
 * Get all students in a clinic
 */
export async function getClinicStudents(clinicName: string): Promise<StudentOverview[]> {
  const overviews = await getStudentOverviews()
  const normalizedClinic = clinicName.toLowerCase().replace(" clinic", "")

  return overviews.filter((s) => {
    const studentClinic = (s.clinic || "").toLowerCase().replace(" clinic", "")
    return studentClinic === normalizedClinic
  })
}

/**
 * Get all unique clients in a clinic
 */
export async function getClinicClients(clinicName: string): Promise<string[]> {
  const students = await getClinicStudents(clinicName)
  const clients = new Set<string>()
  students.forEach((s) => {
    if (s.client_name) clients.add(s.client_name)
  })
  return Array.from(clients)
}

/**
 * Get all debriefs for a clinic
 */
export async function getClinicDebriefs(clinicName: string): Promise<Debrief[]> {
  const allDebriefs = await getDebriefs()
  const normalizedClinic = clinicName.toLowerCase().replace(" clinic", "")

  return allDebriefs.filter((d) => {
    const debriefClinic = (d.clinic || "").toLowerCase().replace(" clinic", "")
    return debriefClinic === normalizedClinic
  })
}

/**
 * Get students for a director
 */
export async function getDirectorStudents(directorEmail: string): Promise<StudentOverview[]> {
  const overviews = await getStudentOverviews()
  return overviews.filter(
    (s) =>
      s.clinic_director_email?.toLowerCase() === directorEmail.toLowerCase() ||
      s.client_director_email?.toLowerCase() === directorEmail.toLowerCase(),
  )
}

/**
 * Get all unique clinics
 */
export async function getAllClinics(): Promise<string[]> {
  const overviews = await getStudentOverviews()
  const clinics = new Set<string>()
  overviews.forEach((s) => {
    if (s.clinic) clinics.add(s.clinic)
  })
  return Array.from(clinics)
}

/**
 * Get all unique client names
 */
export async function getAllClientNames(): Promise<string[]> {
  const overviews = await getStudentOverviews()
  const clients = new Set<string>()
  overviews.forEach((s) => {
    if (s.client_name) clients.add(s.client_name)
  })
  return Array.from(clients)
}

/**
 * Get full team data for a student - used by team-workspace API
 */
export async function getStudentTeamData(studentEmail: string) {
  const student = await getStudentProfile(studentEmail)
  if (!student) return null

  const teammates = await getTeammates(studentEmail)
  const teamDebriefs = await getTeamDebriefs(studentEmail)

  return {
    student,
    teammates,
    debriefs: teamDebriefs,
    clientName: student.client_name,
    clinic: student.clinic,
    clinicDirector: student.clinic_director,
    clientDirector: student.client_director,
  }
}
