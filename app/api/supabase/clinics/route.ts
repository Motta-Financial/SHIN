import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
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
