import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Spring 2026 semester ID
const SPRING_2026_SEMESTER_ID = "a1b2c3d4-e5f6-7890-abcd-202601120000"

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

    const { data: mappingData, error: mappingError } = await supabase
      .from("v_complete_mapping")
      .select("*")
      .eq("client_id", client.id)
      .eq("semester_id", SPRING_2026_SEMESTER_ID)

    if (mappingError) {
      console.error("Error fetching from v_complete_mapping:", mappingError)
    }

    console.log(`[v0] Client Portal Team - Client: ${client.name}, Mapping records: ${mappingData?.length || 0}`)

    // Format team members from v_complete_mapping
    const teamMembers = (mappingData || []).map((m: any) => ({
      id: m.student_id,
      name: m.student_name || "Unknown",
      email: m.student_email || "",
      role: m.student_role || "Team Member",
      clinic: m.student_clinic_name || "",
      isTeamLeader: m.student_role === "Team Leader",
      linkedinProfile: null,
      academicLevel: "",
      education: "",
    }))

    // Get unique directors from the mapping data
    const directorMap = new Map()

    // Add clinic directors
    for (const m of mappingData || []) {
      if (m.clinic_director_id && !directorMap.has(m.clinic_director_id)) {
        directorMap.set(m.clinic_director_id, {
          id: m.clinic_director_id,
          name: m.clinic_director_name || "Unknown",
          email: m.clinic_director_email || "",
          clinicId: m.student_clinic_id,
          jobTitle: "Clinic Director",
          role: "Clinic Director",
          isPrimary: false,
        })
      }

      // Add client director (primary)
      if (m.client_director_id && !directorMap.has(m.client_director_id)) {
        directorMap.set(m.client_director_id, {
          id: m.client_director_id,
          name: m.client_director_name || "Unknown",
          email: m.client_director_email || "",
          clinicId: null,
          jobTitle: "Client Director",
          role: "Client Director",
          isPrimary: true,
        })
      }
    }

    const directors = Array.from(directorMap.values())

    console.log(`[v0] Client Portal Team - Team members: ${teamMembers.length}, Directors: ${directors.length}`)

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
