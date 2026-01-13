import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

const SPRING_2026_SEMESTER_ID = "a1b2c3d4-e5f6-7890-abcd-202601120000"

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()

    const { searchParams } = new URL(request.url)
    const emailFilter = searchParams.get("email")

    let query = supabase.from("v_complete_mapping").select("*").eq("semester_id", SPRING_2026_SEMESTER_ID)

    if (emailFilter) {
      console.log("[v0] students/overview - Filtering by email:", emailFilter)
      // Use filter with ilike operator for case-insensitive matching
      query = query.filter("student_email", "ilike", emailFilter)
    }

    const { data, error } = await query

    if (error) {
      console.log("[v0] Supabase v_complete_mapping error:", error.message)
      return NextResponse.json({ students: [] })
    }

    console.log("[v0] students/overview - Raw data count:", data?.length || 0)

    const studentMap = new Map()
    data?.forEach((row: any) => {
      if (row.student_id && !studentMap.has(row.student_id)) {
        studentMap.set(row.student_id, {
          id: row.student_id,
          student_id: row.student_id,
          student_name: row.student_name,
          student_email: row.student_email,
          student_role: row.student_role,
          clinic: row.student_clinic_name,
          clinic_id: row.student_clinic_id,
          client_name: row.client_name,
          client_id: row.client_id,
        })
      }
    })

    const students = Array.from(studentMap.values())
    console.log(
      "[v0] Fetched students from v_complete_mapping count:",
      students.length,
      emailFilter ? `for email: ${emailFilter}` : "",
    )

    if (emailFilter && students.length > 0) {
      console.log("[v0] students/overview - Found student:", students[0].student_name, students[0].student_email)
    }

    return NextResponse.json({ students })
  } catch (error) {
    console.log("[v0] Error fetching students:", error)
    return NextResponse.json({ students: [] })
  }
}
