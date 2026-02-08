import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET() {
  try {
    const supabase = createServiceClient()

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
