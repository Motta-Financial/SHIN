import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

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
    const directorId = searchParams.get("directorId")
    const status = searchParams.get("status")
    const clinic = searchParams.get("clinic")
    const semesterId = searchParams.get("semesterId")

    const supabase = await getSupabaseClient()

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

    const { data, error } = await query

    if (error) {
      console.error("Error fetching prospects:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in prospects API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient()
    const body = await request.json()

    const { data, error } = await supabase.from("prospects").insert(body).select().single()

    if (error) {
      console.error("Error creating prospect:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in prospects POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await getSupabaseClient()
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

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in prospects PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
