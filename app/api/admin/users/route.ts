import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Verify the caller is an admin
    const authSupabase = await createClient()
    const { data: { user } } = await authSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const serviceSupabase = createServiceClient()

    // Check is_admin on profile
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch all directors, students, clients for current semester
    const [directorsRes, studentsRes, clientsRes] = await Promise.all([
      serviceSupabase
        .from("directors_current")
        .select("id, email, full_name, role, clinic_id, director_id")
        .order("full_name"),
      serviceSupabase
        .from("students_current")
        .select("id, email, full_name, clinic, clinic_id, client_id")
        .order("full_name"),
      serviceSupabase
        .from("clients_current")
        .select("id, name, email")
        .order("name"),
    ])

    const directors = (directorsRes.data || []).map((d) => ({
      id: d.id,
      authUserId: d.director_id || d.id,
      email: d.email,
      name: d.full_name,
      role: "director" as const,
      subRole: d.role,
      clinicId: d.clinic_id,
    }))

    const students = (studentsRes.data || []).map((s) => ({
      id: s.id,
      authUserId: s.id,
      email: s.email,
      name: s.full_name,
      role: "student" as const,
      clinic: s.clinic,
      clinicId: s.clinic_id,
      clientId: s.client_id,
    }))

    const clients = (clientsRes.data || []).map((c) => ({
      id: c.id,
      authUserId: c.id,
      email: c.email,
      name: c.name,
      role: "client" as const,
    }))

    return NextResponse.json({
      directors,
      students,
      clients,
      counts: {
        directors: directors.length,
        students: students.length,
        clients: clients.length,
        total: directors.length + students.length + clients.length,
      },
    })
  } catch (error) {
    console.error("Admin users API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
