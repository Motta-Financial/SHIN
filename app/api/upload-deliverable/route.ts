import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

// Current semester - should be fetched dynamically in production
const CURRENT_SEMESTER_ID = "dff1ee95-485c-4653-b9be-42f73986e3df"

// For App Router, use this for longer timeouts
export const maxDuration = 60

export async function POST(request: NextRequest) {
  console.log("[v0] Upload API called")

  try {
    const contentLength = request.headers.get("content-length")
    console.log("[v0] Content-Length:", contentLength)

    let formData: FormData
    try {
      formData = await request.formData()
    } catch (formError) {
      console.error("[v0] FormData parsing error:", formError)
      return NextResponse.json({ error: "Failed to parse form data - file may be too large" }, { status: 413 })
    }

    const file = formData.get("file") as File
    const studentId = formData.get("studentId") as string
    const studentName = formData.get("studentName") as string
    const clientId = formData.get("clientId") as string
    const clientName = formData.get("clientName") as string
    const submissionType = formData.get("submissionType") as string

    console.log("[v0] Upload request received:", {
      studentId,
      clientId,
      submissionType,
      fileName: file?.name,
      fileSize: file?.size,
    })

    if (!file || !studentId || !clientId || !submissionType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create Supabase client with service role for storage access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("[v0] Missing Supabase credentials")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get mapping data for clinic/director info
    const { data: mappingData, error: mappingError } = await supabase
      .from("v_complete_mapping")
      .select("student_clinic_id, student_clinic_name, clinic_director_id, client_director_id")
      .eq("student_id", studentId)
      .eq("client_id", clientId)
      .limit(1)
      .single()

    console.log("[v0] Mapping data:", mappingData, "Error:", mappingError)

    const clinicId = mappingData?.student_clinic_id || null
    const clinicName = mappingData?.student_clinic_name || null
    const clinicDirectorId = mappingData?.clinic_director_id || null
    const clientDirectorId = mappingData?.client_director_id || null

    // Create file path for Supabase Storage
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filePath = `deliverables/${clientId}/${submissionType}/${timestamp}_${sanitizedFileName}`

    console.log("[v0] Uploading to Supabase Storage:", filePath, "Size:", file.size)

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    console.log("[v0] File converted to buffer, uploading...")

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage.from("SHIN").upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: true,
    })

    if (uploadError) {
      console.error("[v0] Supabase Storage upload error:", uploadError.message)
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 })
    }

    console.log("[v0] Upload successful:", uploadData?.path)

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("SHIN").getPublicUrl(filePath)

    console.log("[v0] Public URL:", publicUrl)

    // Store document record in database
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
        clinic: clinicName,
        clinic_id: clinicId,
        clinic_director_id: clinicDirectorId,
        client_director_id: clientDirectorId,
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

    console.log("[v0] Document created:", docData?.id)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      documentId: docData?.id,
      clinic: clinicName,
      clinicDirectorId,
      clientDirectorId,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 })
  }
}
