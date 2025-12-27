import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    // Fetch announcements from notifications table where type is 'announcement' and target is students
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select(`
        id,
        title,
        message,
        clinic_id,
        created_at,
        type
      `)
      .eq("type", "announcement")
      .eq("target_audience", "students")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching announcements:", error)
      return NextResponse.json({ announcements: [] })
    }

    // Fetch clinic names for announcements that have clinic_id
    const clinicIds = [...new Set(notifications?.filter((n) => n.clinic_id).map((n) => n.clinic_id))]
    let clinicMap: Record<string, string> = {}

    if (clinicIds.length > 0) {
      const { data: clinics } = await supabase.from("clinics").select("id, name").in("id", clinicIds)

      if (clinics) {
        clinicMap = Object.fromEntries(clinics.map((c) => [c.id, c.name]))
      }
    }

    // Transform notifications to announcements format
    const announcements = (notifications || []).map((n) => ({
      id: n.id,
      title: n.title,
      content: n.message,
      postedBy: "Program Director",
      postedAt: n.created_at,
      priority: n.title?.toLowerCase().includes("important") ? "high" : "normal",
      clinicId: n.clinic_id,
      clinicName: n.clinic_id ? clinicMap[n.clinic_id] || null : null,
    }))

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error("Error in announcements GET:", error)
    return NextResponse.json({ announcements: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    const body = await request.json()
    const { title, content, clinicId, priority, postedBy } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    // Get clinic name if clinicId provided
    let clinicName = null
    if (clinicId) {
      const { data: clinic } = await supabase.from("clinics").select("name").eq("id", clinicId).single()

      clinicName = clinic?.name || null
    }

    // Create the announcement notification for students
    const { data: notification, error: notificationError } = await supabase
      .from("notifications")
      .insert({
        type: "announcement",
        title: priority === "high" ? `[Important] ${title}` : title,
        message: content,
        clinic_id: clinicId || null,
        target_audience: "students",
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (notificationError) {
      console.error("Error creating announcement:", notificationError)
      return NextResponse.json({ error: notificationError.message }, { status: 500 })
    }

    // Return the created announcement
    const announcement = {
      id: notification.id,
      title: title,
      content: content,
      postedBy: postedBy || "Program Director",
      postedAt: notification.created_at,
      priority: priority || "normal",
      clinicId: clinicId || null,
      clinicName: clinicName,
    }

    return NextResponse.json({ success: true, announcement })
  } catch (error) {
    console.error("Error in announcements POST:", error)
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 })
  }
}
