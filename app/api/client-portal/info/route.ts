import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get client info
    const { data: client, error: clientError } = await supabase.from("clients").select("*").eq("email", email).single()

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Get team size from client_assignments
    const { data: assignments } = await supabase.from("client_assignments").select("id").eq("client_id", client.id)

    const teamSize = assignments?.length || 0

    return NextResponse.json({
      id: client.id,
      name: client.name,
      email: client.email,
      team_size: teamSize,
      engagement_start: client.created_at,
      clinic: client.clinic || "",
      primary_contact: client.contact_name || "",
      phone: client.phone || "",
      website: client.website || "",
      project_type: client.project_type || "",
      status: client.status || "active",
      semester: client.semester || "",
    })
  } catch (error) {
    console.error("Error fetching client info:", error)
    return NextResponse.json({ error: "Failed to fetch client info" }, { status: 500 })
  }
}
