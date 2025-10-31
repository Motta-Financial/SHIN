import { createClient } from "@/lib/supabase-client"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get("client")

    const supabase = createClient()

    let query = supabase.from("documents").select("*").order("uploaded_at", { ascending: false })

    if (clientName && clientName !== "all") {
      query = query.eq("client_name", clientName)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching documents:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ documents: data || [] })
  } catch (error) {
    console.error("[v0] Error in documents API:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentName, clientName, fileUrl, fileName, description, clinic } = body

    if (!studentName || !clientName || !fileUrl || !fileName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from("documents")
      .insert({
        student_name: studentName,
        client_name: clientName,
        file_url: fileUrl,
        file_name: fileName,
        description: description || "",
        clinic: clinic || "",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving document:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ document: data })
  } catch (error) {
    console.error("[v0] Error in documents POST:", error)
    return NextResponse.json({ error: "Failed to save document" }, { status: 500 })
  }
}
