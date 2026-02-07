import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getCurrentSemesterId } from "@/lib/semester"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json({ error: "Failed to parse form data - file may be too large" }, { status: 413 })
    }

    const file = formData.get("file") as File
    const studentId = formData.get("studentId") as string
    const studentName = formData.get("studentName") as string
    const clientId = formData.get("clientId") as string
    const clientName = formData.get("clientName") as string
    const submissionType = formData.get("submissionType") as string

    if (!file || !studentId || !clientId || !submissionType) {
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

    // Get client director from clients_current
    const { data: clientRow } = await supabase
      .from("clients_current")
      .select("primary_director_id")
      .eq("id", clientId)
      .maybeSingle()
    clientDirectorId = clientRow?.primary_director_id || null

    const clinicId = studentData?.clinic_id || null
    const clinicName = studentData?.clinic || null

    // Create file path for Supabase Storage
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filePath = `deliverables/${clientId}/${submissionType}/${timestamp}_${sanitizedFileName}`

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("SHIN")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("SHIN").getPublicUrl(filePath)

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
        semester_id: currentSemesterId,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (docError) {
      return NextResponse.json({ error: `Document record failed: ${docError.message}` }, { status: 500 })
    }

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    )
  }
}
