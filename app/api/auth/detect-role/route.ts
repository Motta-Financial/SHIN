import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  console.log("[v0] detect-role GET - Health check")
  return NextResponse.json({ status: "ok", message: "detect-role API is running" })
}

export async function POST(request: Request) {
  console.log("[v0] detect-role - API called")

  try {
    // Create client inside handler to avoid build-time env var issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("[v0] detect-role - Env check:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
    })

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[v0] detect-role - Missing Supabase env vars")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    let body
    try {
      body = await request.json()
    } catch (e) {
      console.error("[v0] detect-role - Failed to parse request body:", e)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { email } = body
    console.log("[v0] detect-role - Checking email:", email)

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    console.log("[v0] detect-role - Normalized email:", normalizedEmail)

    // Check directors first
    console.log("[v0] detect-role - Querying directors table...")
    const { data: directors, error: directorError } = await supabaseAdmin
      .from("directors")
      .select("id, email, role, full_name")

    if (directorError) {
      console.error("[v0] detect-role - Director query error:", directorError)
    } else {
      console.log("[v0] detect-role - Directors found:", directors?.length)
    }

    // Find matching director by case-insensitive email
    const directorData = directors?.find((d) => d.email?.toLowerCase() === normalizedEmail)

    if (directorData) {
      console.log("[v0] detect-role - Found director:", directorData.full_name)
      return NextResponse.json({
        role: "director",
        userId: directorData.id,
        userRole: directorData.role,
        userName: directorData.full_name,
        redirect: "/director",
      })
    }

    // Check students
    console.log("[v0] detect-role - Querying students table...")
    const { data: students, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id, email, full_name, clinic")

    if (studentError) {
      console.error("[v0] detect-role - Student query error:", studentError)
    } else {
      console.log("[v0] detect-role - Students found:", students?.length)
    }

    // Find matching student by case-insensitive email
    const studentData = students?.find((s) => s.email?.toLowerCase() === normalizedEmail)

    if (studentData) {
      console.log("[v0] detect-role - Found student:", studentData.full_name)
      return NextResponse.json({
        role: "student",
        userId: studentData.id,
        userName: studentData.full_name,
        clinic: studentData.clinic,
        redirect: "/students",
      })
    }

    // Check clients
    console.log("[v0] detect-role - Querying clients table...")
    const { data: clients, error: clientError } = await supabaseAdmin.from("clients").select("id, name, email")

    if (clientError) {
      console.error("[v0] detect-role - Client query error:", clientError)
    } else {
      console.log("[v0] detect-role - Clients found:", clients?.length)
    }

    // Find matching client by case-insensitive email
    const clientData = clients?.find((c) => c.email?.toLowerCase() === normalizedEmail)

    if (clientData) {
      console.log("[v0] detect-role - Found client:", clientData.name)
      return NextResponse.json({
        role: "client",
        userId: clientData.id,
        userName: clientData.name,
        redirect: "/client-portal",
      })
    }

    // No role found
    console.log("[v0] detect-role - No role found for email:", normalizedEmail)

    return NextResponse.json(
      {
        role: null,
        error: "No matching account found for this email",
      },
      { status: 404 },
    )
  } catch (error) {
    console.error("[v0] detect-role - Unexpected error:", error)
    return NextResponse.json({ error: "Failed to detect user role" }, { status: 500 })
  }
}
