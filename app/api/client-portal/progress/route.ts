import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get("clientName")
    const clientId = searchParams.get("clientId")

    const supabase = await createClient()

    let targetClientId = clientId

    if (!clientId && clientName) {
      const { data: client } = await supabase.from("clients").select("id").eq("name", clientName).single()
      if (client) {
        targetClientId = client.id
      }
    }

    if (!targetClientId) {
      return NextResponse.json({ error: "Client ID or name required" }, { status: 400 })
    }

    // Use debriefs_current view for current semester data only
    const { data: debriefs, error } = await supabase
      .from("debriefs_current")
      .select("*")
      .eq("client_id", targetClientId)
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
