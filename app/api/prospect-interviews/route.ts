import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { supabaseQueryWithRetry } from "@/lib/supabase-retry"

export const dynamic = "force-dynamic"

async function getSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      },
    },
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const prospectId = searchParams.get("prospectId")
    const interviewerId = searchParams.get("interviewerId")
    const status = searchParams.get("status")

    const supabase = await getSupabaseClient()

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
    }, 4, "prospect_interviews")

    if (error) {
      console.error("Error fetching prospect interviews:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
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
