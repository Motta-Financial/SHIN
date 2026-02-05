import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/supabase-js"

// Use service role client for bypassing RLS
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials")
  }
  
  return createClient(supabaseUrl, serviceRoleKey)
}

export async function GET(request: Request) {
  const supabase = getServiceClient()

  const { searchParams } = new URL(request.url)
  const semesterId = searchParams.get("semester_id")
  const weekStart = searchParams.get("week_start")
  const weekEnd = searchParams.get("week_end")

  try {
    let query = supabase.from("published_agendas").select("*").order("published_at", { ascending: false })

    if (semesterId) {
      query = query.eq("semester_id", semesterId)
    }

    if (weekStart && weekEnd) {
      query = query.gte("schedule_date", weekStart).lte("schedule_date", weekEnd)
    }

    // If semester_id is provided without date filters, return all agendas for that semester
    // Otherwise, default to current agenda if no filters at all
    if (!weekStart && !weekEnd && !semesterId) {
      query = query.eq("is_current", true).limit(1)
    }

    const { data, error } = await query

    if (error && error.code !== "PGRST116") throw error

    // Return single or array based on query type
    if (!weekStart && !weekEnd && !semesterId) {
      return NextResponse.json({ success: true, agenda: data?.[0] || null })
    }

    return NextResponse.json({ success: true, agendas: data || [] })
  } catch (error) {
    console.error("Error fetching published agenda:", error)
    return NextResponse.json({ success: false, agenda: null, agendas: [] })
  }
}

export async function POST(request: Request) {
  const supabase = getServiceClient()

  try {
    const body = await request.json()

    // Mark all existing as not current
    await supabase.from("published_agendas").update({ is_current: false }).eq("is_current", true)

    const { data, error } = await supabase
      .from("published_agendas")
      .insert({
        schedule_date: body.schedule_date,
        director_name: body.director_name,
        zoom_link: body.zoom_link,
        schedule_data: body.schedule_data,
        notes: body.notes,
        published_by: body.published_by,
        semester_id: body.semester_id,
        is_current: true,
      })
      .select()
      .single()

    if (error) throw error

    // Create notifications for students about the published agenda
    try {
      const scheduleDate = new Date(body.schedule_date)
      const formattedDate = scheduleDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      
      // Get current semester ID from app_settings if not provided
      let semesterId = body.semester_id
      if (!semesterId) {
        const { data: settingsData } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "current_semester_id")
          .single()
        semesterId = settingsData?.value
      }
      
      // Get all active students for this semester using the students_current view
      // The view already filters by current semester via app_settings
      // No need for status filter - view only returns current semester students
      const { data: students, error: studentsError } = await supabase
        .from("students_current")
        .select("id, full_name, email, clinic_id")
      
      if (studentsError) {
        console.error("Error fetching students for notification:", studentsError.message)
      } else if (students && students.length > 0) {
        // Create individual notifications for each student
        // Use "agenda_published" type which is recognized by Triage component
        const studentNotifications = students.map(student => ({
          type: "agenda_published",
          title: "Class Agenda Published",
          message: `The agenda for ${formattedDate} has been published. Check the Class Course page for details.`,
          target_audience: "students",
          student_id: student.id,
          student_name: student.full_name,
          student_email: student.email,
          clinic_id: student.clinic_id,
          is_read: false,
          created_at: new Date().toISOString(),
        }))
        
        const { data: insertedNotifs, error: insertError } = await supabase
          .from("notifications")
          .insert(studentNotifications)
          .select()
        
        if (insertError) {
          console.error("Error inserting student notifications:", insertError.message)
        }
      }
    } catch (notifError) {
      // Don't fail the agenda publish if notification fails
      console.error("Error creating agenda notification:", notifError)
    }

    return NextResponse.json({ success: true, agenda: data })
  } catch (error) {
    console.error("Error publishing agenda:", error)
    return NextResponse.json({ success: false, error: "Failed to publish agenda" }, { status: 500 })
  }
}
