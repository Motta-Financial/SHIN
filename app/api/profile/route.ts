import { type NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_supabase_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_SUPABASE_SERVICE_ROLE_KEY

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userType = searchParams.get("userType")
  const userId = searchParams.get("userId")
  const userEmail = searchParams.get("userEmail")

  if (!userType || (!userId && !userEmail)) {
    return NextResponse.json({ error: "Missing userType and userId/userEmail" }, { status: 400 })
  }

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
  }

  try {
    let tableName: string
    let selectFields: string

    switch (userType) {
      case "director":
        tableName = "directors"
        selectFields = "id,full_name,email,job_title,role,clinic_id"
        break
      case "student":
        tableName = "students"
        selectFields = "id,full_name,email,linkedin_profile,education,business_experience,academic_level,clinic,status"
        break
      case "client":
        tableName = "clients"
        selectFields = "id,name,email,contact_name,website,project_type,status"
        break
      default:
        return NextResponse.json({ error: "Invalid userType" }, { status: 400 })
    }

    // Build filter
    let filter = ""
    if (userId) {
      filter = `id=eq.${userId}`
    } else if (userEmail) {
      filter = `email=eq.${encodeURIComponent(userEmail)}`
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=${selectFields}&${filter}&limit=1`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Supabase error:", errorText)
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: response.status })
    }

    const data = await response.json()

    if (data.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Normalize the response
    const profile = data[0]
    if (userType === "client") {
      profile.full_name = profile.contact_name || profile.name
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { userType, userId, updates } = body

  if (!userType || !userId || !updates) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
  }

  try {
    let tableName: string
    let allowedFields: string[]

    switch (userType) {
      case "director":
        tableName = "directors"
        allowedFields = ["full_name", "email", "job_title", "role"]
        break
      case "student":
        tableName = "students"
        allowedFields = ["full_name", "email", "linkedin_profile", "education", "business_experience", "academic_level"]
        break
      case "client":
        tableName = "clients"
        allowedFields = ["contact_name", "email", "website", "project_type"]
        break
      default:
        return NextResponse.json({ error: "Invalid userType" }, { status: 400 })
    }

    // Filter updates to only allowed fields
    const filteredUpdates: Record<string, string> = {}
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field]
      }
    }

    // Add updated_at timestamp
    filteredUpdates["updated_at"] = new Date().toISOString()

    const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?id=eq.${userId}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(filteredUpdates),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Supabase update error:", errorText)
      return NextResponse.json({ error: "Failed to update profile" }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
