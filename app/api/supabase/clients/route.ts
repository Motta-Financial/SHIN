import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get("semesterId")
    const includeAll = searchParams.get("includeAll") === "true"

    // Get active semester if not specified and not including all
    let activeSemesterId = semesterId
    if (!activeSemesterId && !includeAll) {
      const { data: activeSemester } = await supabase
        .from("semester_config")
        .select("id")
        .eq("is_active", true)
        .maybeSingle()
      activeSemesterId = activeSemester?.id || null
    }

    // Clinic info comes through clinic_clients junction table
    let query = supabase
      .from("clients")
      .select(`
        *,
        primary_director:directors(id, full_name, email),
        clinic_clients(clinic_id, clinics(id, name))
      `)
      .order("name", { ascending: true })

    // Filter by active semester (Spring 2026) by default
    if (activeSemesterId) {
      query = query.eq("semester_id", activeSemesterId)
    }

    const { data: clients, error } = await query

    if (error) {
      console.log("[v0] Supabase clients error:", error.message)
      return NextResponse.json({ clients: [], records: [] })
    }

    console.log("[v0] Fetched clients count:", clients?.length || 0)

    // New format for client-engagements component
    const formattedClients = (clients || []).map((client) => {
      const clinicRelation = client.clinic_clients?.[0]
      const clinic = clinicRelation?.clinics
      return {
        id: client.id,
        name: client.name,
        contactName: client.contact_name,
        contact_name: client.contact_name,
        email: client.email,
        website: client.website,
        projectType: client.project_type,
        status: client.status,
        semesterId: client.semester_id,
        semester_id: client.semester_id,
        clinicId: clinic?.id || null,
        clinicName: clinic?.name || "",
        directorId: client.primary_director?.id || client.primary_director_id,
        directorName: client.primary_director?.full_name || "",
        primary_director_id: client.primary_director?.id || client.primary_director_id,
        alumniMentor: client.alumni_mentor,
      }
    })

    // Old format for backwards compatibility
    const records = (clients || []).map((client) => ({
      id: client.id,
      fields: {
        Name: client.name,
        "Contact Name": client.contact_name,
        Email: client.email,
        Website: client.website,
        "Project Type": client.project_type,
        Status: client.status,
        Semester: client.semester_id,
        "Alumni Mentor": client.alumni_mentor,
        "Director Lead": client.primary_director?.full_name || "",
      },
    }))

    return NextResponse.json({ clients: formattedClients, records })
  } catch (error) {
    console.log("[v0] Error fetching clients:", error)
    return NextResponse.json({ clients: [], records: [] })
  }
}
