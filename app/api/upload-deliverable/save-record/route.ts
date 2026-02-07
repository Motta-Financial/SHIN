import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getCurrentSemesterId } from "@/lib/semester"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fileName, fileUrl, fileType, fileSize, studentId, studentName, clientId, clientName, submissionType } = body

    if (!fileName || !fileUrl || !studentId || !clientId || !submissionType) {
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

    const { data: docData, error: docError } = await supabase
      .from("documents")
      .insert({
        file_name: fileName,
        file_url: fileUrl,
        file_type: fileType || null,
        file_size: fileSize || null,
        client_id: clientId,
        client_name: clientName || null,
        student_id: studentId,
        student_name: studentName || null,
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
      documentId: docData?.id,
      clinic: clinicName,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save record" },
      { status: 500 },
    )
  }
}
