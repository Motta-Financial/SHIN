import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get("userId")
  const userType = searchParams.get("userType") || searchParams.get("role") // Accept both userType and role

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
          clinic_id
        `)
        .eq("id", userId)
        .single()

      if (error) throw error

      let clinic_name = null
      if (data.clinic_id) {
        const { data: clinicData } = await supabase.from("clinics").select("name").eq("id", data.clinic_id).single()
        clinic_name = clinicData?.name
      }

      profile = {
        ...data,
        clinic_name,
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
          profile_picture_url,
          clinic_id
        `)
        .eq("id", userId)
        .single()

      if (error) throw error

      let clinic_name = null
      if (data.clinic_id) {
        const { data: clinicData } = await supabase.from("clinics").select("name").eq("id", data.clinic_id).single()
        clinic_name = clinicData?.name
      }

      profile = {
        ...data,
        clinic_name,
        role: "director",
      }
    } else if (userType === "client") {
      const { data, error } = await supabase
        .from("clients")
        .select(`
          id,
          name,
          email,
          phone,
          profile_picture_url
        `)
        .eq("id", userId)
        .single()

      if (error) throw error

      profile = {
        ...data,
        full_name: data.name,
        role: "client",
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
    const { userId, userType, role, full_name, phone, bio } = body
    const actualUserType = userType || role

    if (!userId || !actualUserType) {
      return NextResponse.json({ error: "Missing userId or userType/role" }, { status: 400 })
    }

    const supabase = await createClient()

    let tableName: string
    let updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (actualUserType === "student") {
      tableName = "students"
      updateData = {
        ...updateData,
        full_name,
        phone,
        bio,
      }
    } else if (actualUserType === "director") {
      tableName = "directors"
      updateData = {
        ...updateData,
        full_name,
        phone,
        bio,
      }
    } else if (actualUserType === "client") {
      tableName = "clients"
      updateData = {
        ...updateData,
        name: full_name,
        phone,
      }
    } else {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 })
    }

    const { data, error } = await supabase.from(tableName).update(updateData).eq("id", userId).select().single()

    if (error) {
      console.error("[v0] Supabase update error:", error)
      throw error
    }

    // Get clinic name
    let clinic_name = null
    if (actualUserType === "student" || actualUserType === "director") {
      if (data.clinic_id) {
        const { data: clinicData } = await supabase.from("clinics").select("name").eq("id", data.clinic_id).single()
        clinic_name = clinicData?.name
      }
    }

    return NextResponse.json({
      profile: {
        ...data,
        full_name: actualUserType === "client" ? data.name : data.full_name,
        clinic_name,
        role: actualUserType,
      },
    })
  } catch (error) {
    console.error("[v0] Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
