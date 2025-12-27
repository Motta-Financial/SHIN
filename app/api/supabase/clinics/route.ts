import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { data: clinics, error } = await supabase.from("clinics").select("id, name").order("name")

    if (error) {
      console.error("Error fetching clinics:", error)
      return NextResponse.json({ success: true, clinics: [] })
    }

    return NextResponse.json({ success: true, clinics: clinics || [] })
  } catch (error) {
    console.error("Error in clinics API:", error)
    return NextResponse.json({ success: false, clinics: [] })
  }
}
