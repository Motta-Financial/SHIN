import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const authUserId = searchParams.get("authUserId")
    const clientId = searchParams.get("clientId")
    const email = searchParams.get("email") // Legacy fallback

    if (!authUserId && !clientId && !email) {
      return NextResponse.json({ error: "authUserId, clientId, or email required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get client info - prefer UUID-based lookups over email
    let query = supabase.from("clients").select("*")
    
    if (clientId) {
      query = query.eq("id", clientId)
    } else if (authUserId) {
      query = query.eq("auth_user_id", authUserId)
    } else if (email) {
      // Legacy fallback
      query = query.eq("email", email)
    }
    
    const { data: client, error: clientError } = await query.single()

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
