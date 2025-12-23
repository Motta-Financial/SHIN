import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const clinic = searchParams.get("clinic")

    let query = supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50)

    if (clinic && clinic !== "all") {
      query = query.eq("clinic", clinic)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error("Error fetching notifications:", error.message)
      return NextResponse.json({ notifications: [] })
    }

    return NextResponse.json({ notifications: notifications || [] })
  } catch (error) {
    console.error("Error in notifications API:", error)
    return NextResponse.json({ notifications: [] })
  }
}
