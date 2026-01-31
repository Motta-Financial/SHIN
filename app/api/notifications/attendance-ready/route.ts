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
    const { data: students, error: studentsError } = await supabase
      .from("students_current")
      .select("id, name, email, clinic_id")
      .eq("semester_id", semesterId)
      .eq("is_active", true)

    if (studentsError) {
      console.error("Error fetching students:", studentsError)
      return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
    }

    if (!students || students.length === 0) {
      return NextResponse.json({ success: true, message: "No students to notify" })
    }

    // Create notifications for all students
    const notifications = students.map(student => ({
      type: "attendance_ready",
      title: "Attendance Open",
      message: `Attendance for Week ${weekNumber} (${classDate}) is now open. Please submit your attendance during class.`,
      student_id: student.id,
      student_name: student.name,
      student_email: student.email,
      clinic_id: student.clinic_id,
      target_audience: "students",
      related_id: `week-${weekNumber}`,
      created_by_user_id: createdByEmail,
      is_read: false,
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
