import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get("clientName")

    if (!clientName) {
      return NextResponse.json({ error: "Client name required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get all documents submitted by students for this client
    const { data: documents, error } = await supabase
      .from("documents")
      .select("*")
      .eq("client_name", clientName)
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
