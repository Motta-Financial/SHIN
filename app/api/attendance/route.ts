import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const clinic = searchParams.get("clinic")
    const weekEnding = searchParams.get("weekEnding")

    let query = supabase.from("attendance").select("*").order("class_date", { ascending: false })

    if (clinic && clinic !== "all") {
      query = query.eq("clinic", clinic)
    }

    if (weekEnding) {
      query = query.eq("week_ending", weekEnding)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching attendance:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ records: data || [] })
  } catch (error) {
    console.error("[v0] Error in attendance API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase.from("attendance").insert([body]).select()

    if (error) {
      console.error("[v0] Error creating attendance:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Error in attendance POST:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
