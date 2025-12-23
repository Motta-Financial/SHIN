import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get director
    const { data: director, error: directorError } = await supabase
      .from("directors")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (directorError) throw directorError
    if (!director) {
      return NextResponse.json({ success: false, error: "Director not found" }, { status: 404 })
    }

    // Get assigned clients
    const { data: clientDirectors } = await supabase
      .from("client_directors")
      .select(`
        is_primary,
        clients:client_id (
          id,
          name
        )
      `)
      .eq("director_id", id)

    const clients =
      clientDirectors
        ?.map((cd: any) => ({
          id: cd.clients?.id,
          name: cd.clients?.name,
          isPrimary: cd.is_primary,
        }))
        .filter((c: any) => c.id) || []

    return NextResponse.json({
      success: true,
      data: {
        id: director.id,
        full_name: director.full_name,
        email: director.email,
        clinic: director.clinic,
        job_title: director.job_title,
        role: director.role,
        semester: director.semester,
        clients,
      },
    })
  } catch (error) {
    console.error("Error fetching director:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch director" }, { status: 500 })
  }
}
