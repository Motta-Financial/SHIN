import { NextResponse } from "next/server"
import { getServiceClient } from "@/lib/supabase/service-client"

export async function POST(request: Request) {
  const supabase = getServiceClient()

  try {
    const { weekNumber, semesterId, weekStart, weekEnd, createdByName, createdByEmail } = await request.json()

    if (!weekNumber || !semesterId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Format the class date nicely
    const classDate = new Date(weekStart).toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    })

    // Get all active students for this semester
    // students_current view already filters by current semester via app_settings
    // Do NOT add .eq("semester_id", ...) as this causes filtering issues
    const { data: students, error: studentsError } = await supabase
      .from("students_current")
      .select("id, full_name, email, clinic_id")

    if (studentsError) {
      console.error("Error fetching students:", studentsError)
      return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
    }

    if (!students || students.length === 0) {
      return NextResponse.json({ success: true, message: "No students to notify" })
    }

    // Create notifications for all students
    const notifications = students.map(student => ({
      type: "announcement",
      title: "Attendance Open",
      message: `Attendance for Week ${weekNumber} (${classDate}) is now open. Please submit your attendance during class.`,
      student_id: student.id,
      student_name: student.full_name,
      student_email: student.email,
      clinic_id: student.clinic_id,
      target_audience: "students",
      is_read: false,
      created_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications)

    if (insertError) {
      console.error("Error creating notifications:", insertError)
      return NextResponse.json({ error: "Failed to create notifications" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Notified ${students.length} students that attendance is open` 
    })

  } catch (error) {
    console.error("Error in attendance-ready notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
