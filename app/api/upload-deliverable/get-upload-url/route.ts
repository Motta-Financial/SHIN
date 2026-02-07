import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getCurrentSemesterId } from "@/lib/semester"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, studentName, clientId, clientName, submissionType, fileName, fileType, fileSize } = body

    if (!studentId || !clientId || !submissionType || !fileName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServiceClient()
    const currentSemesterId = await getCurrentSemesterId()

    // Get student's clinic info from students_current (source of truth)
    const { data: studentData } = await supabase
      .from("students_current")
      .select("clinic_id, clinic")
      .eq("id", studentId)
      .maybeSingle()

    // Get clinic director from directors_current
    let clinicDirectorId: string | null = null
    let clientDirectorId: string | null = null
    if (studentData?.clinic_id) {
      const { data: dirData } = await supabase
        .from("directors_current")
        .select("id")
        .eq("clinic_id", studentData.clinic_id)
        .maybeSingle()
      clinicDirectorId = dirData?.id || null
    }

    // Get client director
    const { data: clientRow } = await supabase
      .from("clients_current")
      .select("primary_director_id")
      .eq("id", clientId)
      .maybeSingle()
    clientDirectorId = clientRow?.primary_director_id || null

    const clinicId = studentData?.clinic_id || null
    const clinicName = studentData?.clinic || null

    // Create file path
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filePath = `deliverables/${clientId}/${submissionType}/${timestamp}_${sanitizedFileName}`

    // Create a signed upload URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("SHIN")
      .createSignedUploadUrl(filePath)

    if (signedUrlError) {
      return NextResponse.json({ error: `Failed to create upload URL: ${signedUrlError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from("SHIN").getPublicUrl(filePath)

    // Create document record
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
        semester_id: currentSemesterId,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (docError) {
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get upload URL" },
      { status: 500 },
    )
  }
}
