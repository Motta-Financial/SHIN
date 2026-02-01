import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { createBulkStudentNotifications } from "@/lib/notifications"

// Service role client for admin operations (bypasses RLS after authorization check)
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials for service client")
  }
  
  return createServiceClient(supabaseUrl, serviceRoleKey)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get("semesterId")
    const weekNumber = searchParams.get("weekNumber")

    const supabase = await createClient()

    let query = supabase.from("attendance_passwords").select("*").order("week_number", { ascending: true })

    if (semesterId) {
      query = query.eq("semester_id", semesterId)
    }

    if (weekNumber) {
      query = query.eq("week_number", weekNumber)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching attendance passwords:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ passwords: data || [] })
  } catch (error: any) {
    console.error("[v0] Unexpected error in attendance-password route:", error.message)
    return NextResponse.json({ error: error.message || "Failed to fetch passwords" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { weekNumber, semesterId, password, weekStart, weekEnd, createdByName, userEmail } = body

    if (!weekNumber || !semesterId || !password) {
      return NextResponse.json(
        { error: "Missing required fields: weekNumber, semesterId, and password are required" },
        { status: 400 },
      )
    }

    if (!userEmail) {
      return NextResponse.json({ error: "User email is required for authorization" }, { status: 400 })
    }

    // Use service role client for all operations
    const serviceClient = getServiceClient()

    // Check if user is in directors table (case-insensitive email match)
    const { data: directors, error: directorError } = await serviceClient
      .from("directors")
      .select("id, email, full_name")
      .ilike("email", userEmail)
      .limit(1)
    
    const director = directors?.[0]
    const isDirector = !!director
    
    if (!isDirector) {
      return NextResponse.json(
        { error: "Only directors can set attendance passwords" },
        { status: 403 },
      )
    }

    // Generate default dates if not provided (assuming Spring 2026 starts Jan 13, 2026)
    const defaultWeekStart = weekStart || new Date(2026, 0, 13 + (weekNumber - 1) * 7).toISOString().split("T")[0]
    const defaultWeekEnd = weekEnd || new Date(2026, 0, 19 + (weekNumber - 1) * 7).toISOString().split("T")[0]

    // Upsert the password (update if exists, insert if not)
    const { data, error } = await serviceClient
      .from("attendance_passwords")
      .upsert(
        {
          week_number: weekNumber,
          semester_id: semesterId,
          password,
          week_start: defaultWeekStart,
          week_end: defaultWeekEnd,
          created_by: null,
          created_by_name: createdByName || director?.full_name || userEmail,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "semester_id,week_number",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("Error creating/updating attendance password:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send notification to all students that attendance password is set for this week
    try {
      const classDate = new Date(defaultWeekStart).toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      })
      
      const notificationResult = await createBulkStudentNotifications(
        "attendance",
        "Attendance Password Set",
        `The attendance password for Week ${weekNumber} (${classDate}) has been set by ${createdByName || director?.full_name || 'a director'}. You can now submit your attendance during class.`,
        semesterId
      )
      
      if (notificationResult.success) {
        console.log(`[v0] Sent attendance password notification to ${notificationResult.count} students`)
      } else {
        console.error("[v0] Failed to send attendance notifications:", notificationResult.error)
      }
    } catch (notificationError) {
      // Don't fail the request if notifications fail - password was still set successfully
      console.error("[v0] Error sending attendance notifications:", notificationError)
    }

    return NextResponse.json({ password: data, success: true })
  } catch (error: any) {
    console.error("Unexpected error in attendance-password POST:", error.message)
    return NextResponse.json({ error: error.message || "Failed to create password" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing password ID" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is a director or admin
    const userEmail = user.email

    const { data: director } = await supabase
      .from("directors_current")
      .select("id, email")
      .eq("email", userEmail)
      .single()

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    const isDirector = !!director
    const isAdmin = profile?.is_admin === true

    if (!isDirector && !isAdmin) {
      return NextResponse.json(
        { error: "Only directors and admins can delete attendance passwords" },
        { status: 403 },
      )
    }

    // Use service role client for delete operation
    const serviceClient = getServiceClient()

    const { error } = await serviceClient.from("attendance_passwords").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting attendance password:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Unexpected error in attendance-password DELETE:", error.message)
    return NextResponse.json({ error: error.message || "Failed to delete password" }, { status: 500 })
  }
}
