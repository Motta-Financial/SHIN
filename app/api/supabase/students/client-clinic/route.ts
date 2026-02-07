import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("students_current")
      .select("id, full_name, email, clinic, clinic_id, client_id")

    if (error) {
      return NextResponse.json({ data: [] })
    }

    // Fetch client names for mapping
    const clientIds = [...new Set((data || []).map((s: any) => s.client_id).filter(Boolean))]
    let clientMap = new Map<string, string>()
    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .from("clients_current")
        .select("id, name")
        .in("id", clientIds)
      for (const c of clients || []) {
        clientMap.set(c.id, c.name)
      }
    }

    const students = (data || []).map((s: any) => ({
      student_id: s.id,
      student_name: s.full_name,
      student_email: s.email,
      clinic: s.clinic,
      clinic_id: s.clinic_id,
      client_name: clientMap.get(s.client_id) || null,
      client_id: s.client_id,
    }))

    return NextResponse.json({ data: students })
  } catch {
    return NextResponse.json({ data: [] })
  }
}
