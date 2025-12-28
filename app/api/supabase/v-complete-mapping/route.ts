import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const clinicId = searchParams.get("clinicId")
    const clientId = searchParams.get("clientId")
    const studentId = searchParams.get("studentId")
    const directorId = searchParams.get("directorId")

    let query = supabase.from("v_complete_mapping").select("*")

    // Apply filters based on provided parameters
    if (clinicId) {
      query = query.eq("student_clinic_id", clinicId)
    }
    if (clientId) {
      query = query.eq("client_id", clientId)
    }
    if (studentId) {
      query = query.eq("student_id", studentId)
    }
    if (directorId) {
      query = query.or(`clinic_director_id.eq.${directorId},client_director_id.eq.${directorId}`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching v_complete_mapping:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      records: data || [],
      mappings: data || [],
    })
  } catch (err) {
    console.error("Error in v-complete-mapping route:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
