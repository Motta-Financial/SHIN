import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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
      ) // Return 200 so frontend can handle gracefully
    }

    // Get team members assigned to this client
    const { data: assignments, error: assignmentsError } = await supabase
      .from("client_assignments")
      .select(`
        id,
        role,
        clinic,
        assigned_at,
        student_id,
        students (
          id,
          full_name,
          email,
          is_team_leader,
          clinic,
          linkedin_profile,
          academic_level,
          education
        )
      `)
      .eq("client_id", client.id)

    if (assignmentsError) {
      console.error("Error fetching assignments:", assignmentsError)
    }

    // Get directors assigned to this client
    const { data: clientDirectors, error: directorsError } = await supabase
      .from("client_directors")
      .select(`
        id,
        is_primary,
        director_id,
        directors (
          id,
          full_name,
          email,
          clinic,
          job_title,
          role
        )
      `)
      .eq("client_id", client.id)

    if (directorsError) {
      console.error("Error fetching client directors:", directorsError)
    }

    // Format team members
    const teamMembers = (assignments || []).map((a: any) => ({
      id: a.student_id,
      name: a.students?.full_name || "Unknown",
      email: a.students?.email || "",
      role: a.role || "Team Member",
      clinic: a.clinic || a.students?.clinic || "",
      isTeamLeader: a.students?.is_team_leader || a.role === "Team Leader",
      linkedinProfile: a.students?.linkedin_profile || null,
      academicLevel: a.students?.academic_level || "",
      education: a.students?.education || "",
      assignedAt: a.assigned_at,
    }))

    // Format directors
    const directors = (clientDirectors || []).map((d: any) => ({
      id: d.director_id,
      name: d.directors?.full_name || "Unknown",
      email: d.directors?.email || "",
      clinic: d.directors?.clinic || "",
      jobTitle: d.directors?.job_title || "Director",
      role: d.directors?.role || "Director",
      isPrimary: d.is_primary,
    }))

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
