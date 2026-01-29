import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

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

    // Check if user is in directors table (any semester - all directors can set passwords)
    const { data: director } = await serviceClient
      .from("directors")
      .select("id, email, full_name")
      .eq("email", userEmail)
      .limit(1)
      .single()

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
      console.error("[v0] Error creating/updating attendance password:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ password: data, success: true })
  } catch (error: any) {
    console.error("[v0] Unexpected error in attendance-password POST:", error.message)
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
