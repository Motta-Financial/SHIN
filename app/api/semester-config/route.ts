import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("semester_config").select("*").order("start_date", { ascending: false })

    if (error) {
      console.error("Error fetching semester config:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ semesters: data || [] })
  } catch (error) {
    console.error("Error in semester-config API:", error)
    return NextResponse.json({ error: "Failed to fetch semester configuration" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { semesterName, startDate, endDate, isActive } = body

    if (!semesterName || !startDate || !endDate) {
      return NextResponse.json({ error: "Semester name, start date, and end date are required" }, { status: 400 })
    }

    // If this semester is being set as active, deactivate all others
    if (isActive) {
      await supabase
        .from("semester_config")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000")
    }

    const { data, error } = await supabase
      .from("semester_config")
      .insert({
        semester_name: semesterName,
        start_date: startDate,
        end_date: endDate,
        is_active: isActive || false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating semester:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ semester: data })
  } catch (error) {
    console.error("Error in semester-config POST:", error)
    return NextResponse.json({ error: "Failed to create semester" }, { status: 500 })
  }
}
