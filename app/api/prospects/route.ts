import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { supabaseQueryWithRetry } from "@/lib/supabase-retry"
import { getCached, setCache, getCacheKey, clearCache } from "@/lib/api-cache"


export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const directorId = searchParams.get("directorId")
    const status = searchParams.get("status")
    const clinic = searchParams.get("clinic")
    const semesterId = searchParams.get("semesterId")

    // Check cache first
    const cacheKey = getCacheKey("prospects", {
      directorId: directorId || undefined,
      status: status || undefined,
      clinic: clinic || undefined,
      semesterId: semesterId || undefined,
    })
    const cached = getCached<{ data: any[] }>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const supabase = createServiceClient()

    const { data, error } = await supabaseQueryWithRetry(() => {
      let query = supabase.from("prospects").select("*").order("name", { ascending: true })

      if (directorId) {
        query = query.or(`interviewer_id.eq.${directorId},director_in_charge_id.eq.${directorId}`)
      }
      if (status) {
        query = query.eq("acceptance_status", status)
      }
      if (clinic) {
        query = query.or(`clinic_of_interest.ilike.%${clinic}%,suggested_clinic.ilike.%${clinic}%`)
      }
      if (semesterId) {
        query = query.eq("target_semester_id", semesterId)
      }

      return query
    }, 3, "prospects")

    if (error) {
      console.error("Error fetching prospects:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result = { data: data || [] }
    setCache(cacheKey, result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in prospects API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { data, error } = await supabase.from("prospects").insert(body).select().single()

    if (error) {
      console.error("Error creating prospect:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    clearCache("prospects")
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in prospects POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { id, ...updates } = body

    const { data, error } = await supabase
      .from("prospects")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating prospect:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    clearCache("prospects")
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in prospects PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
