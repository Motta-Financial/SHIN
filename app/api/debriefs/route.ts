import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    const weekEnding = searchParams.get("week_ending")
    const clinic = searchParams.get("clinic")
    const studentEmail = searchParams.get("student_email")
    const status = searchParams.get("status")
    const useSupabase = searchParams.get("source") !== "airtable"

    // Check if Supabase tables are ready
    const tablesReady = process.env.SUPABASE_TABLES_READY === "true"

    if (!tablesReady || !useSupabase) {
      console.log("[v0] Using Airtable for debriefs data")
      return NextResponse.json({
        debriefs: [],
        source: "airtable",
        message: "Using Airtable as primary data source",
      })
    }

    let query = supabase.from("debriefs").select("*").order("date_submitted", { ascending: false })

    // Apply filters
    if (weekEnding) {
      query = query.eq("week_ending", weekEnding)
    }
    if (clinic && clinic !== "all") {
      query = query.eq("clinic", clinic)
    }
    if (studentEmail) {
      query = query.eq("student_email", studentEmail)
    }
    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      // Check if error is due to missing table
      if (error.code === "PGRST205" || error.message.includes("Could not find")) {
        console.log("[v0] Debriefs table not found, returning empty array")
        return NextResponse.json({
          debriefs: [],
          source: "supabase",
          setupRequired: true,
        })
      }
      console.error("[v0] Error fetching debriefs:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[v0] Fetched ${data?.length || 0} debriefs from Supabase`)
    return NextResponse.json({ debriefs: data || [], source: "supabase" })
  } catch (error) {
    console.error("[v0] Error in debriefs GET:", error)
    return NextResponse.json({ error: "Failed to fetch debriefs", debriefs: [] }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      student_name,
      student_email,
      client_name,
      clinic,
      hours_worked,
      work_summary,
      questions,
      week_ending,
      status = "submitted",
    } = body

    // Validate required fields
    if (!student_name || !student_email || !client_name || !clinic || !hours_worked || !work_summary || !week_ending) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Look up student_id from students table (optional, may not exist)
    let studentId = null
    try {
      const { data: studentData } = await supabase.from("students").select("id").eq("email", student_email).single()
      studentId = studentData?.id
    } catch {
      // Student table might not exist or student not found
      console.log("[v0] Student lookup skipped or failed")
    }

    const debriefData = {
      student_id: studentId,
      student_name,
      student_email,
      client_name,
      clinic,
      hours_worked: Number.parseFloat(hours_worked),
      work_summary,
      questions: questions || null,
      week_ending,
      status,
      date_submitted: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("debriefs").insert(debriefData).select().single()

    if (error) {
      console.error("[v0] Error creating debrief:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Created debrief:", data.id)
    return NextResponse.json({ debrief: data }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in debriefs POST:", error)
    return NextResponse.json({ error: "Failed to create debrief" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Debrief ID is required" }, { status: 400 })
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("debriefs").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating debrief:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Updated debrief:", id)
    return NextResponse.json({ debrief: data })
  } catch (error) {
    console.error("[v0] Error in debriefs PATCH:", error)
    return NextResponse.json({ error: "Failed to update debrief" }, { status: 500 })
  }
}
