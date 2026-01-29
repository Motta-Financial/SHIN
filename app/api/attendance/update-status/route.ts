import { type NextRequest, NextResponse } from "next/server"
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { attendanceId, isPresent, userEmail } = body

    if (!attendanceId || isPresent === undefined || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields: attendanceId, isPresent, and userEmail are required" },
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
        { error: "Only directors can update attendance status" },
        { status: 403 },
      )
    }

    // Update the attendance record
    const { data, error } = await serviceClient
      .from("attendance")
      .update({ is_present: isPresent })
      .eq("id", attendanceId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating attendance status:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Unexpected error updating attendance status:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
