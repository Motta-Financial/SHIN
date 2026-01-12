import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string
    const userType = formData.get("userType") as string

    if (!file || !userId || !userType) {
      return NextResponse.json({ error: "Missing file, userId, or userType" }, { status: 400 })
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
    const tableName = userType === "student" ? "students" : "directors"

    const { error } = await supabase
      .from(tableName)
      .update({
        profile_picture_url: blob.url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw error

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("[v0] Error uploading photo:", error)
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 })
  }
}
