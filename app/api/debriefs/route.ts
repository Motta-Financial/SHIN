import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    
    const weekEnding = searchParams.get("week_ending")
    const clinic = searchParams.get("clinic")
    const studentEmail = searchParams.get("student_email")
    const status = searchParams.get("status")

    let query = supabase
      .from("debriefs")
      .select("*")
      .order("date_submitted", { ascending: false })

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
      console.error("[v0] Error fetching debriefs:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[v0] Fetched ${data?.length || 0} debriefs from Supabase`)
    return NextResponse.json({ debriefs: data || [] })
  } catch (error) {
    console.error("[v0] Error in debriefs GET:", error)
    return NextResponse.json(
      { error: "Failed to fetch debriefs" },
      { status: 500 }
    )
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
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Look up student_id from students table
    const { data: studentData } = await supabase
      .from("students")
      .select("id")
      .eq("email", student_email)
      .single()

    const debriefData = {
      student_id: studentData?.id || null,
      student_name,
      student_email,
      client_name,
      clinic,
      hours_worked: parseFloat(hours_worked),
      work_summary,
      questions: questions || null,
      week_ending,
      status,
    }

    const { data, error } = await supabase
      .from("debriefs")
      .insert(debriefData)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating debrief:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Created debrief:", data.id)
    return NextResponse.json({ debrief: data }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in debriefs POST:", error)
    return NextResponse.json(
      { error: "Failed to create debrief" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: "Debrief ID is required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("debriefs")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating debrief:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Updated debrief:", id)
    return NextResponse.json({ debrief: data })
  } catch (error) {
    console.error("[v0] Error in debriefs PATCH:", error)
    return NextResponse.json(
      { error: "Failed to update debrief" },
      { status: 500 }
    )
  }
}
