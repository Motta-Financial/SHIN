import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { getCached, setCache, getCacheKey, LONG_TTL } from "@/lib/api-cache"

// Reconstructs v_complete_mapping data from *_current views (the source of truth)
// instead of the legacy v_complete_mapping materialized view.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get("clinicId")
    const clientId = searchParams.get("clientId")
    const studentId = searchParams.get("studentId")
    const directorId = searchParams.get("directorId")

    const cacheKey = getCacheKey("v-complete-mapping-v2", {
      clinicId: clinicId || undefined,
      clientId: clientId || undefined,
      studentId: studentId || undefined,
      directorId: directorId || undefined,
    })
    const cached = getCached<{ success: boolean; data: unknown[]; records: unknown[]; mappings: unknown[] }>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const supabase = createServiceClient()

    // Fetch from *_current views (already filtered to active semester)
    const [studentsRes, clientsRes, directorsRes] = await Promise.all([
      supabase.from("students_current").select("id, full_name, email, clinic_id, clinic, client_id, is_team_leader, semester_id"),
      supabase.from("clients_current").select("id, name, email, primary_director_id, status, semester_id"),
      supabase.from("directors_current").select("id, full_name, email, clinic_id, semester_id"),
    ])

    const students = studentsRes.data || []
    const clients = clientsRes.data || []
    const directors = directorsRes.data || []

    // Build lookup maps
    const clientMap = new Map(clients.map((c: any) => [c.id, c]))
    const directorMap = new Map(directors.map((d: any) => [d.id, d]))
    // Map clinic_id -> director for clinic director lookup
    const clinicDirectorMap = new Map<string, any>()
    directors.forEach((d: any) => {
      if (d.clinic_id) clinicDirectorMap.set(d.clinic_id, d)
    })

    // Build the mapping rows (same shape as v_complete_mapping)
    let mappings: any[] = students.map((s: any) => {
      const client = s.client_id ? clientMap.get(s.client_id) : null
      const clientDirector = client?.primary_director_id ? directorMap.get(client.primary_director_id) : null
      const clinicDirector = s.clinic_id ? clinicDirectorMap.get(s.clinic_id) : null

      return {
        student_id: s.id,
        student_name: s.full_name,
        student_email: s.email,
        student_clinic_id: s.clinic_id,
        student_clinic_name: s.clinic,
        student_role: s.is_team_leader ? "Team Leader" : "Consultant",
        client_id: s.client_id || client?.id || null,
        client_name: client?.name || null,
        client_status: client?.status || null,
        clinic_director_id: clinicDirector?.id || null,
        clinic_director_name: clinicDirector?.full_name || null,
        clinic_director_email: clinicDirector?.email || null,
        client_director_id: clientDirector?.id || null,
        client_director_name: clientDirector?.full_name || null,
        client_director_email: clientDirector?.email || null,
        semester_id: s.semester_id,
      }
    })

    // Apply filters
    if (clinicId) {
      mappings = mappings.filter((m: any) => m.student_clinic_id === clinicId)
    }
    if (clientId) {
      mappings = mappings.filter((m: any) => m.client_id === clientId)
    }
    if (studentId) {
      mappings = mappings.filter((m: any) => m.student_id === studentId)
    }
    if (directorId) {
      mappings = mappings.filter((m: any) => m.clinic_director_id === directorId || m.client_director_id === directorId)
    }

    const response = {
      success: true,
      data: mappings,
      records: mappings,
      mappings: mappings,
    }
    setCache(cacheKey, response, LONG_TTL)
    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ success: false, data: [], records: [], mappings: [] })
  }
}
