import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  try {
    const supabase = getSupabaseClient()

    const { data: clinics, error } = await supabase.from("clinics").select("id, name").order("name")

    if (error) {
      console.error("[v0] Error fetching clinics:", error)
      return NextResponse.json({ clinics: [], error: error.message }, { status: 500 })
    }

    return NextResponse.json({ clinics: clinics || [] })
  } catch (error: any) {
    console.error("[v0] Error in clinics API:", error)
    return NextResponse.json({ clinics: [], error: error.message }, { status: 500 })
  }
}
