import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getCachedData, setCachedData } from "@/lib/api-cache"

function getSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const semesterId = searchParams.get("semesterId")

    const cacheKey = `attendance:${studentId || "all"}:${semesterId || "all"}`
    const cached = getCachedData(cacheKey)
    if (cached) {
      console.log("[v0] Attendance API - Returning cached response")
      return NextResponse.json(cached)
    }

    const supabase = getSupabaseClient()

    let query = supabase.from("attendance").select("*").order("date", { ascending: false })

    if (studentId) {
      query = query.eq("student_id", studentId)
    }
    if (semesterId) {
      query = query.eq("semester_id", semesterId)
    }

    const { data, error } = await query

    if (error) {
      console.log("[v0] Supabase attendance error:", error)
      throw error
    }

    const response = { attendance: data || [] }
    setCachedData(cacheKey, response)
    console.log(`[v0] Attendance API - Fetched and cached attendance count: ${data?.length || 0}`)

    return NextResponse.json(response)
  } catch (error: any) {
    const errorMessage = error?.message || String(error)
    console.log("[v0] Supabase attendance error:", errorMessage)

    if (errorMessage.includes("Too Many") || errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      return NextResponse.json(
        { attendance: [], error: "Rate limited, please retry", rateLimited: true },
        { status: 429 },
      )
    }

    return NextResponse.json({ attendance: [], error: errorMessage })
  }
}
