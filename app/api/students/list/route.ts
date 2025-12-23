import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: students, error } = await supabase
      .from("students")
      .select("id, full_name, email, clinic, status")
      .eq("status", "Active")
      .order("full_name")

    if (error) throw error

    return NextResponse.json({
      success: true,
      students: students || [],
    })
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch students" }, { status: 500 })
  }
}
