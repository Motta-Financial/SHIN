import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const clinicId = searchParams.get("clinicId")
    const clientId = searchParams.get("clientId")
    const studentId = searchParams.get("studentId")

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

    const { data, error } = await query

    if (error) {
      console.error("Error fetching v_complete_mapping:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      records: data || [],
      mappings: data || [], // Alias for compatibility
    })
  } catch (err) {
    console.error("Error in v-complete-mapping route:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
