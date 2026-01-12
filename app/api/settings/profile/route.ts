import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get("userId")
  const userType = searchParams.get("userType")

  if (!userId || !userType) {
    return NextResponse.json({ error: "Missing userId or userType" }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    let profile = null

    if (userType === "student") {
      const { data, error } = await supabase
        .from("students")
        .select(`
          id,
          full_name,
          email,
          phone,
          bio,
          profile_picture_url,
          clinics (name)
        `)
        .eq("id", userId)
        .single()

      if (error) throw error

      profile = {
        ...data,
        clinic_name: data.clinics?.name,
        role: "student",
      }
    } else if (userType === "director") {
      const { data, error } = await supabase
        .from("directors")
        .select(`
          id,
          full_name,
          email,
          phone,
          bio,
          profile_picture_url
        `)
        .eq("id", userId)
        .single()

      if (error) throw error

      // Get clinic name from clinic_directors
      const { data: clinicData } = await supabase
        .from("clinic_directors")
        .select("clinics (name)")
        .eq("director_id", userId)
        .limit(1)
        .single()

      profile = {
        ...data,
        clinic_name: clinicData?.clinics?.name,
        role: "director",
      }
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("[v0] Error fetching profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userType, full_name, phone, bio } = body

    if (!userId || !userType) {
      return NextResponse.json({ error: "Missing userId or userType" }, { status: 400 })
    }

    const supabase = await createClient()

    const tableName = userType === "student" ? "students" : "directors"

    const { data, error } = await supabase
      .from(tableName)
      .update({
        full_name,
        phone,
        bio,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error

    // Get clinic name
    let clinic_name = null
    if (userType === "student") {
      const { data: clinicData } = await supabase.from("clinics").select("name").eq("id", data.clinic_id).single()
      clinic_name = clinicData?.name
    } else {
      const { data: clinicData } = await supabase
        .from("clinic_directors")
        .select("clinics (name)")
        .eq("director_id", userId)
        .limit(1)
        .single()
      clinic_name = clinicData?.clinics?.name
    }

    return NextResponse.json({
      profile: {
        ...data,
        clinic_name,
        role: userType,
      },
    })
  } catch (error) {
    console.error("[v0] Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
