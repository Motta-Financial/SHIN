import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { supabaseQueryWithRetry } from "@/lib/supabase-retry"

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data: clinics, error } = await supabaseQueryWithRetry(
      () => supabase.from("clinics").select("id, name").order("name"),
      3,
      "clinics",
    )

    if (error) {
      return NextResponse.json({ clinics: [] })
    }

    return NextResponse.json({ clinics: clinics || [] })
  } catch {
    return NextResponse.json({ clinics: [] })
  }
}
