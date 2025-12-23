import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("client_documents")
      .select("*")
      .order("uploaded_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("client_documents")
      .insert({
        file_name: body.file_name,
        file_url: body.file_url,
        file_type: body.file_type,
        description: body.description,
        uploaded_by_name: body.uploaded_by_name,
        uploaded_by_email: body.uploaded_by_email,
      })
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}
