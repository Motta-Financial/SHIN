import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured")
  }

  return createClient(url, key)
}

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const audience = searchParams.get("audience") || "students"

    const { data: announcementsData, error } = await supabaseAdmin
      .from("announcements")
      .select("*")
      .in("target_audience", audience === "all" ? ["students", "directors"] : [audience])
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching announcements:", error)
      return NextResponse.json({ announcements: [] })
    }

    // Fetch clinic names for announcements that have clinic_id
    const clinicIds = [...new Set(announcementsData?.filter((a) => a.clinic_id).map((a) => a.clinic_id))]
    let clinicMap: Record<string, string> = {}

    if (clinicIds.length > 0) {
      const { data: clinics } = await supabaseAdmin.from("clinics").select("id, name").in("id", clinicIds)

      if (clinics) {
        clinicMap = Object.fromEntries(clinics.map((c) => [c.id, c.name]))
      }
    }

    // Transform to expected format
    const announcements = (announcementsData || []).map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      postedBy: a.posted_by || "Program Director",
      postedAt: a.created_at,
      priority: a.priority || "normal",
      clinicId: a.clinic_id,
      clinicName: a.clinic_id ? clinicMap[a.clinic_id] || null : null,
      targetAudience: a.target_audience,
    }))

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error("Error in announcements GET:", error)
    return NextResponse.json({ announcements: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const body = await request.json()
    const { title, content, clinicId, priority, postedBy, targetAudience } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    // Get clinic name if clinicId provided
    let clinicName = null
    if (clinicId) {
      const { data: clinic } = await supabaseAdmin.from("clinics").select("name").eq("id", clinicId).single()
      clinicName = clinic?.name || null
    }

    const { data: announcement, error: announcementError } = await supabaseAdmin
      .from("announcements")
      .insert({
        title: priority === "high" ? `[Important] ${title}` : title,
        content: content,
        posted_by: postedBy || "Program Director",
        priority: priority || "normal",
        clinic_id: clinicId || null,
        target_audience: targetAudience || "students",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (announcementError) {
      console.error("Error creating announcement:", announcementError)
      return NextResponse.json({ error: announcementError.message }, { status: 500 })
    }

    // Return the created announcement
    const result = {
      id: announcement.id,
      title: title,
      content: content,
      postedBy: postedBy || "Program Director",
      postedAt: announcement.created_at,
      priority: priority || "normal",
      clinicId: clinicId || null,
      clinicName: clinicName,
      targetAudience: targetAudience || "students",
    }

    return NextResponse.json({ success: true, announcement: result })
  } catch (error) {
    console.error("Error in announcements POST:", error)
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 })
  }
}
