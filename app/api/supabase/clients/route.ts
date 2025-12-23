import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data: clients, error } = await supabase
      .from("clients")
      .select(`
        *,
        primary_director:directors(full_name, clinic)
      `)
      .order("name", { ascending: true })

    if (error) {
      console.log("[v0] Supabase clients error:", error.message)
      return NextResponse.json({ records: [] })
    }

    console.log("[v0] Fetched clients count:", clients?.length || 0)

    // Transform to match the expected format
    const records = (clients || []).map((client) => ({
      id: client.id,
      fields: {
        Name: client.name,
        "Contact Name": client.contact_name,
        Email: client.email,
        Website: client.website,
        "Project Type": client.project_type,
        Status: client.status,
        Semester: client.semester,
        "Alumni Mentor": client.alumni_mentor,
        "Director Lead": client.primary_director?.full_name || "",
      },
    }))

    return NextResponse.json({ records })
  } catch (error) {
    console.log("[v0] Error fetching clients:", error)
    return NextResponse.json({ records: [] })
  }
}
