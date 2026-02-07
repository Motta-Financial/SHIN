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

    // Helper: run a query with retry for rate limits
    async function queryWithRetry<T>(fn: () => Promise<{ data: T | null; error: any }>): Promise<{ data: T | null; error: any }> {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const result = await fn()
          if (result.error) {
            const errMsg = typeof result.error === "string" ? result.error : result.error?.message || ""
            if (errMsg.toLowerCase().includes("too many") || errMsg.toLowerCase().includes("rate limit")) {
              if (attempt < 2) {
                await new Promise((r) => setTimeout(r, (attempt + 1) * 1500))
                continue
              }
            }
          }
          return result
        } catch (err: any) {
          const msg = err?.message?.toLowerCase() || ""
          if ((msg.includes("too many") || msg.includes("unexpected token")) && attempt < 2) {
            await new Promise((r) => setTimeout(r, (attempt + 1) * 1500))
            continue
          }
          return { data: null, error: err }
        }
      }
      return { data: null, error: "Max retries reached" }
    }

    // Check directors first
    const { data: directorData } = await queryWithRetry(() =>
      supabaseAdmin
        .from("directors_current")
        .select("id, email, role, full_name, clinic_id")
        .ilike("email", normalizedEmail)
        .maybeSingle()
    )

    if (directorData) {
      return NextResponse.json({
        role: "director",
        userId: directorData.id,
        userRole: directorData.role,
        userName: directorData.full_name,
        clinicId: directorData.clinic_id,
        redirect: "/director",
      })
    }

    // Check students
    const { data: studentData } = await queryWithRetry(() =>
      supabaseAdmin
        .from("students_current")
        .select("id, email, full_name, clinic, clinic_id, client_id")
        .ilike("email", normalizedEmail)
        .maybeSingle()
    )

    if (studentData) {
      return NextResponse.json({
        role: "student",
        userId: studentData.id,
        userName: studentData.full_name,
        clinic: studentData.clinic,
        clinicId: studentData.clinic_id,
        clientId: studentData.client_id,
        redirect: "/students",
      })
    }

    // Check clients
    const { data: clientData } = await queryWithRetry(() =>
      supabaseAdmin
        .from("clients_current")
        .select("id, name, email")
        .ilike("email", normalizedEmail)
        .maybeSingle()
    )

    if (clientData) {
      return NextResponse.json({
        role: "client",
        userId: clientData.id,
        userName: clientData.name,
        redirect: "/client-portal",
      })
    }

    // Fallback: check base tables directly (in case *_current views have semester issues)
    const { data: directorBase } = await queryWithRetry(() =>
      supabaseAdmin
        .from("directors")
        .select("id, email, role, full_name, clinic_id")
        .ilike("email", normalizedEmail)
        .limit(1)
        .maybeSingle()
    )
    if (directorBase) {
      return NextResponse.json({
        role: "director",
        userId: directorBase.id,
        userRole: directorBase.role,
        userName: directorBase.full_name,
        clinicId: directorBase.clinic_id,
        redirect: "/director",
      })
    }

    const { data: studentBase } = await queryWithRetry(() =>
      supabaseAdmin
        .from("students")
        .select("id, email, full_name, clinic, clinic_id, client_id")
        .ilike("email", normalizedEmail)
        .limit(1)
        .maybeSingle()
    )
    if (studentBase) {
      return NextResponse.json({
        role: "student",
        userId: studentBase.id,
        userName: studentBase.full_name,
        clinic: studentBase.clinic,
        clinicId: studentBase.clinic_id,
        clientId: studentBase.client_id,
        redirect: "/students",
      })
    }

    const { data: clientBase } = await queryWithRetry(() =>
      supabaseAdmin
        .from("clients")
        .select("id, name, email")
        .ilike("email", normalizedEmail)
        .limit(1)
        .maybeSingle()
    )
    if (clientBase) {
      return NextResponse.json({
        role: "client",
        userId: clientBase.id,
        userName: clientBase.name,
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
