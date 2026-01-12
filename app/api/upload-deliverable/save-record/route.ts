import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Hardcoded current semester ID - no database query needed
const CURRENT_SEMESTER_ID = "dff1ee95-485c-4653-b9be-42f73986e3df"

export async function POST(request: Request) {
  console.log("[v0] Save-record API hit")

  try {
    const body = await request.json()
    console.log("[v0] Request body:", JSON.stringify(body))

    const { fileName, fileUrl, fileType, fileSize, studentId, studentName, clientId, clientName, submissionType } = body

    if (!fileName || !fileUrl || !studentId || !clientId || !submissionType) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create Supabase client with service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("[v0] Missing Supabase credentials")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get mapping data for clinic/director info
    console.log("[v0] Fetching mapping data for student:", studentId, "client:", clientId)
    const { data: mappingData, error: mappingError } = await supabase
      .from("v_complete_mapping")
      .select("student_clinic_id, student_clinic_name, clinic_director_id, client_director_id")
      .eq("student_id", studentId)
      .eq("client_id", clientId)
      .limit(1)
      .single()

    if (mappingError) {
      console.log("[v0] Mapping error (non-fatal):", mappingError.message)
    }

    const clinicId = mappingData?.student_clinic_id || null
    const clinicName = mappingData?.student_clinic_name || null
    const clinicDirectorId = mappingData?.clinic_director_id || null
    const clientDirectorId = mappingData?.client_director_id || null

    console.log("[v0] Clinic info:", { clinicId, clinicName, clinicDirectorId, clientDirectorId })

    const insertData = {
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
      semester_id: CURRENT_SEMESTER_ID,
      uploaded_at: new Date().toISOString(),
    }

    console.log("[v0] Inserting document:", JSON.stringify(insertData))

    const { data: docData, error: docError } = await supabase.from("documents").insert(insertData).select().single()

    if (docError) {
      console.error("[v0] Document insert error:", docError.message)
      return NextResponse.json({ error: `Document record failed: ${docError.message}` }, { status: 500 })
    }

    console.log("[v0] Document created successfully:", docData?.id)

    return NextResponse.json({
      success: true,
      documentId: docData?.id,
      clinic: clinicName,
    })
  } catch (error) {
    console.error("[v0] Save record error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save record" },
      { status: 500 },
    )
  }
}
