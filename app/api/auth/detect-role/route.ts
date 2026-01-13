import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Use service role to bypass RLS for role detection
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()

    // Check directors first
    const { data: directorData, error: directorError } = await supabaseAdmin
      .from("directors")
      .select("id, email, role, full_name")
      .ilike("email", normalizedEmail)
      .maybeSingle()

    if (directorError) {
      console.error("[v0] detect-role - Director query error:", directorError)
    }

    if (directorData) {
      return NextResponse.json({
        role: "director",
        userId: directorData.id,
        userRole: directorData.role,
        userName: directorData.full_name,
        redirect: "/director",
      })
    }

    // Check students
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id, email, full_name, clinic")
      .ilike("email", normalizedEmail)
      .maybeSingle()

    if (studentError) {
      console.error("[v0] detect-role - Student query error:", studentError)
    }

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
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("id, name, email")
      .ilike("email", normalizedEmail)
      .maybeSingle()

    if (clientError) {
      console.error("[v0] detect-role - Client query error:", clientError)
    }

    if (clientData) {
      return NextResponse.json({
        role: "client",
        userId: clientData.id,
        userName: clientData.name,
        redirect: "/client-portal",
      })
    }

    // No role found
    return NextResponse.json(
      {
        role: null,
        error: "No matching account found for this email",
      },
      { status: 404 },
    )
  } catch (error) {
    console.error("[v0] detect-role - Error:", error)
    return NextResponse.json({ error: "Failed to detect user role" }, { status: 500 })
  }
}
