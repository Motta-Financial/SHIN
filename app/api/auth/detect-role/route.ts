import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json({ status: "ok", message: "detect-role API is running" })
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("detect-role - Missing Supabase env vars. URL:", !!supabaseUrl, "Key:", !!supabaseServiceKey)
      return NextResponse.json({ 
        error: "Server configuration error",
        debug: { hasUrl: !!supabaseUrl, hasKey: !!supabaseServiceKey }
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    let body
    try {
      body = await request.json()
    } catch (e) {
      console.error("detect-role - Failed to parse request body:", e)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check directors first
    const { data: directors, error: directorError } = await supabaseAdmin
      .from("directors")
      .select("id, email, role, full_name")

    if (directorError) {
      console.error("detect-role - Director query error:", directorError)
    }

    const directorData = directors?.find((d) => d.email?.toLowerCase() === normalizedEmail)

    if (directorData) {
      return NextResponse.json({
        role: "director",
        userId: directorData.id,
        userRole: directorData.role,
        userName: directorData.full_name,
        redirect: "/director",
      })
    }

    // Check students - use students_current view to get ONLY the current semester's student record
    // This is critical because a student may exist in multiple semesters with different IDs
    const { data: students, error: studentError } = await supabaseAdmin
      .from("students_current")
      .select("id, email, full_name, clinic, clinic_id")

    if (studentError) {
      console.error("detect-role - Student query error:", studentError)
    }

    const studentData = students?.find((s) => s.email?.toLowerCase() === normalizedEmail)

    if (studentData) {
      return NextResponse.json({
        role: "student",
        userId: studentData.id,
        userName: studentData.full_name,
        clinic: studentData.clinic,
        redirect: "/students",
      })
    }

    // Check clients
    const { data: clients, error: clientError } = await supabaseAdmin.from("clients").select("id, name, email")

    if (clientError) {
      console.error("detect-role - Client query error:", clientError)
    }

    const clientData = clients?.find((c) => c.email?.toLowerCase() === normalizedEmail)

    if (clientData) {
      return NextResponse.json({
        role: "client",
        userId: clientData.id,
        userName: clientData.name,
        redirect: "/client-portal",
      })
    }

    return NextResponse.json(
      {
        role: null,
        error: "No matching account found for this email",
      },
      { status: 404 },
    )
  } catch (error) {
    console.error("detect-role - Unexpected error:", error)
    return NextResponse.json({ error: "Failed to detect user role" }, { status: 500 })
  }
}
