import { NextRequest, NextResponse } from "next/server"
import { getServiceClient } from "@/lib/supabase/service-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, classDate, semesterId, isExcused, userEmail } = body

    if (!studentId || !classDate || isExcused === undefined || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, classDate, isExcused, and userEmail are required" },
        { status: 400 },
      )
    }

    const serviceClient = getServiceClient()

    // Check if user is a director (case-insensitive email match)
    const { data: directors } = await serviceClient
      .from("directors")
      .select("id, email, full_name")
      .ilike("email", userEmail)
      .limit(1)
    
    const director = directors?.[0]
    const isDirector = !!director

    if (!isDirector) {
      return NextResponse.json(
        { error: "Only directors can mark attendance as excused" },
        { status: 403 },
      )
    }

    // Update the attendance record
    let query = serviceClient
      .from("attendance")
      .update({ is_excused: isExcused })
      .eq("student_id", studentId)
      .eq("class_date", classDate)
    
    if (semesterId) {
      query = query.eq("semester_id", semesterId)
    }

    const { data, error } = await query.select().single()

    if (error) {
      console.error("Error updating excused status:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ attendance: data, success: true })
  } catch (error: any) {
    console.error("Unexpected error in mark-excused:", error.message)
    return NextResponse.json({ error: error.message || "Failed to update excused status" }, { status: 500 })
  }
}
