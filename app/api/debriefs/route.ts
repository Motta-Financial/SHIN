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
    const clientId = searchParams.get("clientId")

    const cacheKey = `debriefs:${studentId || "all"}:${clientId || "all"}`
    const cached = getCachedData(cacheKey)
    if (cached) {
      console.log("[v0] Debriefs API - Returning cached response")
      return NextResponse.json(cached)
    }

    const supabase = getSupabaseClient()

    let query = supabase
      .from("debriefs")
      .select(`
      *,
      students!debriefs_student_id_fkey(id, full_name, email),
      clients!debriefs_client_id_fkey(id, name)
    `)
      .order("debrief_date", { ascending: false })

    if (studentId) {
      query = query.eq("student_id", studentId)
    }
    if (clientId) {
      query = query.eq("client_id", clientId)
    }

    const { data, error } = await query

    if (error) {
      console.log("[v0] Supabase debriefs error:", error)
      throw error
    }

    const response = { debriefs: data || [] }
    setCachedData(cacheKey, response)
    console.log(`[v0] Debriefs API - Fetched and cached debriefs count: ${data?.length || 0}`)

    return NextResponse.json(response)
  } catch (error: any) {
    const errorMessage = error?.message || String(error)
    console.log("[v0] Supabase debriefs error:", errorMessage)

    if (errorMessage.includes("Too Many") || errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      return NextResponse.json(
        { debriefs: [], error: "Rate limited, please retry", rateLimited: true },
        { status: 429 },
      )
    }

    return NextResponse.json({ debriefs: [], error: errorMessage })
  }
}
