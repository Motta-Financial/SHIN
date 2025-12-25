import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get("client")
    const clientId = searchParams.get("clientId")
    const submissionType = searchParams.get("submissionType")

    const supabase = await createClient()

    let query = supabase.from("documents").select("*").order("uploaded_at", { ascending: false })

    if (clientId && clientId !== "all") {
      query = query.eq("client_id", clientId)
    } else if (clientName && clientName !== "all") {
      query = query.eq("client_name", clientName)
    }

    if (submissionType && submissionType !== "all") {
      query = query.eq("submission_type", submissionType)
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
    const {
      studentId,
      studentName,
      clientId,
      clientName,
      fileUrl,
      fileName,
      fileType,
      description,
      clinic,
      submissionType,
    } = body

    if (!fileUrl || !fileName) {
      return NextResponse.json({ error: "Missing required fields: fileUrl and fileName" }, { status: 400 })
    }

    const supabase = await createClient()

    const insertData: Record<string, any> = {
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType || fileName.split(".").pop() || "unknown",
      description: description || "",
      clinic: clinic || "",
      submission_type: submissionType || "document",
      uploaded_at: new Date().toISOString(),
    }

    // Add optional foreign key references if provided
    if (clientId) insertData.client_id = clientId
    if (clientName) insertData.client_name = clientName
    if (studentId) insertData.student_id = studentId
    if (studentName) insertData.student_name = studentName

    const { data, error } = await supabase.from("documents").insert(insertData).select().single()

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
