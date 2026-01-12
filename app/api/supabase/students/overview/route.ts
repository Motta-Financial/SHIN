import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

const SPRING_2026_SEMESTER_ID = "a1b2c3d4-e5f6-7890-abcd-202601120000"

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("v_complete_mapping")
      .select("*")
      .eq("semester_id", SPRING_2026_SEMESTER_ID)

    if (error) {
      console.log("[v0] Supabase v_complete_mapping error:", error.message)
      return NextResponse.json({ students: [] })
    }

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
    console.log("[v0] Fetched students from v_complete_mapping count:", students.length)
    return NextResponse.json({ students })
  } catch (error) {
    console.log("[v0] Error fetching students:", error)
    return NextResponse.json({ students: [] })
  }
}
