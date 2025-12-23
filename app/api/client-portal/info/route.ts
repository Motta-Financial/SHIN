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

    // Get team size
    const { data: assignments, error: assignError } = await supabase
      .from("client_assignments")
      .select("*")
      .eq("client_id", client.id)

    const teamSize = assignments?.length || 0

    const mockClientData = {
      id: "mock-client-1",
      name: "Acme Corporation",
      email: "sample@client.com",
      team_size: 5,
      engagement_start: "2024-09-01",
      clinic: "Consulting",
      primary_contact: "John Smith",
      phone: "(555) 123-4567",
    }

    return NextResponse.json(mockClientData)
  } catch (error) {
    console.error("Error fetching client info:", error)
    return NextResponse.json({ error: "Failed to fetch client info" }, { status: 500 })
  }
}
