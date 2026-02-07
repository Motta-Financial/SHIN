import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCurrentSemesterId } from "@/lib/semester"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")
    const clientEmail = searchParams.get("email")

    const supabase = await createClient()

    let client = null

    if (clientId) {
      const { data, error } = await supabase.from("clients").select("*").eq("id", clientId).maybeSingle()
      if (error) console.error("Error fetching client by ID:", error)
      client = data
    } else if (clientEmail) {
      const { data, error } = await supabase.from("clients").select("*").eq("email", clientEmail).maybeSingle()
      if (error) console.error("Error fetching client by email:", error)
      client = data
    }

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          error: "Client not found",
          client: null,
          teamMembers: [],
          directors: [],
        },
        { status: 200 },
      )
    }

    // Use *_current views (source of truth for Spring 2026)
    const { data: studentData } = await supabase
      .from("students_current")
      .select("id, full_name, email, clinic_id, clinic, is_team_leader")
      .eq("client_id", client.id)

    const teamMembers = (studentData || []).map((s: any) => ({
      id: s.id,
      name: s.full_name || "Unknown",
      email: s.email || "",
      role: s.is_team_leader ? "Team Leader" : "Consultant",
      clinic: s.clinic || "",
      isTeamLeader: s.is_team_leader || false,
      linkedinProfile: null,
      academicLevel: "",
      education: "",
    }))

    // Get directors: primary director from client, clinic directors from student clinic_ids
    const directorMap = new Map()

    if (client.primary_director_id) {
      const { data: primaryDir } = await supabase
        .from("directors_current")
        .select("id, full_name, email")
        .eq("id", client.primary_director_id)
        .maybeSingle()
      if (primaryDir) {
        directorMap.set(primaryDir.id, {
          id: primaryDir.id,
          name: primaryDir.full_name || "Unknown",
          email: primaryDir.email || "",
          clinicId: null,
          jobTitle: "Client Director",
          role: "Client Director",
          isPrimary: true,
        })
      }
    }

    // Get clinic directors for each unique clinic_id
    const clinicIds = [...new Set((studentData || []).map((s: any) => s.clinic_id).filter(Boolean))]
    if (clinicIds.length > 0) {
      const { data: clinicDirs } = await supabase
        .from("directors_current")
        .select("id, full_name, email, clinic_id")
        .in("clinic_id", clinicIds)

      for (const d of clinicDirs || []) {
        if (!directorMap.has(d.id)) {
          directorMap.set(d.id, {
            id: d.id,
            name: d.full_name || "Unknown",
            email: d.email || "",
            clinicId: d.clinic_id,
            jobTitle: "Clinic Director",
            role: "Clinic Director",
            isPrimary: false,
          })
        }
      }
    }

    const directors = Array.from(directorMap.values())

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        contactName: client.contact_name,
        website: client.website,
        projectType: client.project_type,
        status: client.status,
        semester: client.semester,
        alumniMentor: client.alumni_mentor,
      },
      teamMembers,
      directors,
    })
  } catch (error) {
    console.error("Error in client team API:", error)
    return NextResponse.json({ error: "Failed to fetch team data" }, { status: 500 })
  }
}
