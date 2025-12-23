import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: clients, error } = await supabase
      .from("clients")
      .select("id, name, email, contact_name, status, semester")
      .eq("status", "active")
      .order("name")

    if (error) {
      console.error("Error fetching clients:", error)
      return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      clients: clients || [],
    })
  } catch (error) {
    console.error("Error in clients API:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
