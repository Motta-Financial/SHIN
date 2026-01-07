import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

// Increase body size limit for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}

// Current semester - should be fetched dynamically in production
const CURRENT_SEMESTER_ID = "dff1ee95-485c-4653-b9be-42f73986e3df"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const studentId = formData.get("studentId") as string
    const studentName = formData.get("studentName") as string
    const clientId = formData.get("clientId") as string
    const clientName = formData.get("clientName") as string
    const submissionType = formData.get("submissionType") as string

    if (!file || !studentId || !clientId || !submissionType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create Supabase client with service role for storage access
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Fetch clinic and director info from v_complete_mapping
    const { data: mappingData } = await supabase
      .from("v_complete_mapping")
      .select("student_clinic_id, clinic_director_id, client_director_id")
      .eq("student_id", studentId)
      .eq("client_id", clientId)
      .limit(1)
      .single()

    const clinicId = mappingData?.student_clinic_id || null
    const directorId = mappingData?.client_director_id || mappingData?.clinic_director_id || null

    // Create file path
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filePath = `deliverables/${clientId}/${submissionType}/${timestamp}_${sanitizedFileName}`

    // Upload to Supabase Storage using REST API directly
    const arrayBuffer = await file.arrayBuffer()

    const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/SHIN/${filePath}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": file.type || "application/octet-stream",
      },
      body: arrayBuffer,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error("[v0] Supabase Storage upload error:", errorText)
      return NextResponse.json({ error: `Storage upload failed: ${errorText}` }, { status: 500 })
    }

    // Get public URL
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/SHIN/${filePath}`

    // Save document record to database
    const { data: docData, error: docError } = await supabase
      .from("documents")
      .insert({
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        client_id: clientId,
        client_name: clientName,
        student_id: studentId,
        student_name: studentName,
        clinic_id: clinicId,
        director_id: directorId,
        submission_type: submissionType,
        semester_id: CURRENT_SEMESTER_ID,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (docError) {
      console.error("[v0] Document insert error:", docError)
      return NextResponse.json({ error: `Document record failed: ${docError.message}` }, { status: 500 })
    }

    // Note: Notification is created automatically by database trigger

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      documentId: docData?.id,
      clinicId,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 })
  }
}
