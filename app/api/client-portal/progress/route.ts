import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get("clientName")

    if (!clientName) {
      return NextResponse.json({ error: "Client name required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get recent debriefs (work summaries) for this client
    const { data: debriefs, error } = await supabase
      .from("debriefs")
      .select("*")
      .eq("client_name", clientName)
      .order("week_ending", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching progress:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ progress: debriefs || [] })
  } catch (error) {
    console.error("Error in progress API:", error)
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 })
  }
}
