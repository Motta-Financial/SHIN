import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const clientName = formData.get("clientName") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith(".pptx") && !file.name.endsWith(".ppt")) {
      return NextResponse.json({ error: "Invalid file type. Only .pptx and .ppt files are allowed." }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`presentations/${clientName}/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    })

    console.log("[v0] Presentation uploaded:", blob.url)

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
      size: file.size,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
