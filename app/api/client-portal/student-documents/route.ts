import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get("clientName")
    const clientId = searchParams.get("clientId")

    const supabase = await createClient()

    let targetClientId = clientId

    if (!clientId && clientName) {
      const { data: client } = await supabase.from("clients").select("id").eq("name", clientName).single()
      if (client) {
        targetClientId = client.id
      }
    }

    if (!targetClientId) {
      return NextResponse.json({ error: "Client ID or name required" }, { status: 400 })
    }

    const { data: documents, error } = await supabase
      .from("documents")
      .select("*")
      .eq("client_id", targetClientId)
      .order("uploaded_at", { ascending: false })

    if (error) {
      console.error("Error fetching student documents:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ documents: documents || [] })
  } catch (error) {
    console.error("Error in student-documents API:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}
