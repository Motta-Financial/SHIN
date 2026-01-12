import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/utils/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string
    const userType = (formData.get("userType") || formData.get("role")) as string

    if (!file || !userId || !userType) {
      return NextResponse.json({ error: "Missing file, userId, or userType/role" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`profile-photos/${userType}/${userId}-${Date.now()}.${file.type.split("/")[1]}`, file, {
      access: "public",
    })

    // Update database with new photo URL
    const supabase = await createClient()

    let tableName: string
    if (userType === "student") {
      tableName = "students"
    } else if (userType === "director") {
      tableName = "directors"
    } else if (userType === "client") {
      tableName = "clients"
    } else {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 })
    }

    const { error } = await supabase
      .from(tableName)
      .update({
        profile_picture_url: blob.url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("[v0] Database update error:", error)
      throw error
    }

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("[v0] Error uploading photo:", error)
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 })
  }
}
