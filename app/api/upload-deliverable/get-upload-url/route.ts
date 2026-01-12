import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

// Current semester - should be fetched dynamically in production
const CURRENT_SEMESTER_ID = "dff1ee95-485c-4653-b9be-42f73986e3df"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, studentName, clientId, clientName, submissionType, fileName, fileType, fileSize } = body

    console.log("[v0] Get upload URL request:", { studentId, clientId, submissionType, fileName, fileSize })

    if (!studentId || !clientId || !submissionType || !fileName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get mapping data for clinic/director info
    const { data: mappingData } = await supabase
      .from("v_complete_mapping")
      .select("student_clinic_id, student_clinic_name, clinic_director_id, client_director_id")
      .eq("student_id", studentId)
      .eq("client_id", clientId)
      .limit(1)
      .single()

    const clinicId = mappingData?.student_clinic_id || null
    const clinicName = mappingData?.student_clinic_name || null
    const clinicDirectorId = mappingData?.clinic_director_id || null
    const clientDirectorId = mappingData?.client_director_id || null

    // Create file path
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filePath = `deliverables/${clientId}/${submissionType}/${timestamp}_${sanitizedFileName}`

    // Create a signed upload URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("SHIN")
      .createSignedUploadUrl(filePath)

    if (signedUrlError) {
      console.error("[v0] Signed URL error:", signedUrlError)
      return NextResponse.json({ error: `Failed to create upload URL: ${signedUrlError.message}` }, { status: 500 })
    }

    console.log("[v0] Created signed upload URL for:", filePath)

    // Get public URL for after upload
    const {
      data: { publicUrl },
    } = supabase.storage.from("SHIN").getPublicUrl(filePath)

    // Pre-create the document record (will be updated when upload completes)
    const { data: docData, error: docError } = await supabase
      .from("documents")
      .insert({
        file_name: fileName,
        file_url: publicUrl,
        file_type: fileType || "application/octet-stream",
        file_size: fileSize,
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

    return NextResponse.json({
      signedUrl: signedUrlData.signedUrl,
      token: signedUrlData.token,
      path: filePath,
      publicUrl,
      documentId: docData.id,
    })
  } catch (error) {
    console.error("[v0] Get upload URL error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get upload URL" },
      { status: 500 },
    )
  }
}
