import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const clientName = formData.get("clientName") as string
    const studentName = formData.get("studentName") as string
    const submissionType = formData.get("submissionType") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] Uploading file:", file.name, "Size:", (file.size / 1024 / 1024).toFixed(2), "MB")

    // Upload to Vercel Blob using put method
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    })

    console.log("[v0] Upload successful:", blob.url)

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      fileName: file.name,
      fileSize: file.size,
      clientName,
      studentName,
      submissionType,
    })
  } catch (error: any) {
    console.error("[v0] Upload error:", error.message || error)
    return NextResponse.json({ error: error?.message || "Upload failed" }, { status: 500 })
  }
}
