import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get client
    const { data: client, error: clientError } = await supabase.from("clients").select("*").eq("id", id).maybeSingle()

    if (clientError) throw clientError
    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 })
    }

    // Get assigned directors
    const { data: clientDirectors } = await supabase
      .from("client_directors")
      .select(`
        is_primary,
        directors:director_id (
          id,
          full_name
        )
      `)
      .eq("client_id", id)

    const directors =
      clientDirectors
        ?.map((cd: any) => ({
          id: cd.directors?.id,
          name: cd.directors?.full_name,
          isPrimary: cd.is_primary,
        }))
        .filter((d: any) => d.id) || []

    // Get team members
    const { data: clientAssignments } = await supabase
      .from("client_assignments")
      .select(`
        role,
        students:student_id (
          id,
          full_name,
          clinic,
          is_team_leader
        )
      `)
      .eq("client_id", id)

    const team_members =
      clientAssignments
        ?.map((ca: any) => ({
          id: ca.students?.id,
          name: ca.students?.full_name,
          clinic: ca.students?.clinic,
          isTeamLeader: ca.students?.is_team_leader,
        }))
        .filter((m: any) => m.id) || []

    return NextResponse.json({
      success: true,
      data: {
        id: client.id,
        name: client.name,
        email: client.email,
        contact_name: client.contact_name,
        website: client.website,
        project_type: client.project_type,
        status: client.status,
        semester: client.semester,
        alumni_mentor: client.alumni_mentor,
        directors,
        team_members,
      },
    })
  } catch (error) {
    console.error("Error fetching client:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch client" }, { status: 500 })
  }
}
