import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { supabaseQueryWithRetry } from "@/lib/supabase-retry"
import { getCached, setCache, getCacheKey } from "@/lib/api-cache"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const prospectId = searchParams.get("prospectId")
    const interviewerId = searchParams.get("interviewerId")
    const status = searchParams.get("status")

    const cacheKey = getCacheKey("prospect-interviews", {
      prospectId: prospectId || undefined,
      interviewerId: interviewerId || undefined,
      status: status || undefined,
    })
    const cached = getCached<{ data: any[] }>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const supabase = createServiceClient()

    const { data, error } = await supabaseQueryWithRetry(() => {
      let query = supabase
        .from("prospect_interviews")
        .select("*")
        .order("interview_date", { ascending: false, nullsFirst: false })

      if (prospectId) {
        query = query.eq("prospect_id", prospectId)
      }
      if (interviewerId) {
        query = query.eq("interviewer_id", interviewerId)
      }
      if (status) {
        query = query.eq("interview_status", status)
      }

      return query
    }, 3, "prospect_interviews")

    if (error) {
      console.error("Error fetching prospect interviews:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result = { data: data || [] }
    setCache(cacheKey, result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in prospect-interviews API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient()
    const body = await request.json()

    const { data, error } = await supabase.from("prospect_interviews").insert(body).select().single()

    if (error) {
      console.error("Error creating prospect interview:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in prospect-interviews POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
