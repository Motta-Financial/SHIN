import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CHUNK_SIZE = 3 * 1024 * 1024 // 3MB chunks (safely under 4.5MB limit)

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const chunk = formData.get("chunk") as File
    const chunkIndex = Number.parseInt(formData.get("chunkIndex") as string)
    const totalChunks = Number.parseInt(formData.get("totalChunks") as string)
    const fileName = formData.get("fileName") as string
    const uploadId = formData.get("uploadId") as string

    if (!chunk || isNaN(chunkIndex) || isNaN(totalChunks) || !fileName || !uploadId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`[v0] Uploading chunk ${chunkIndex + 1}/${totalChunks} for ${fileName}`)

    // Upload chunk to Vercel Blob with unique name
    const chunkFileName = `${uploadId}-chunk-${chunkIndex}-${fileName}`
    const blob = await put(chunkFileName, chunk, {
      access: "public",
      addRandomSuffix: false,
    })

    console.log(`[v0] Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully`)

    return NextResponse.json({
      success: true,
      chunkIndex,
      chunkUrl: blob.url,
    })
  } catch (error: any) {
    console.error("[v0] Chunk upload error:", error.message || error)
    return NextResponse.json({ error: error?.message || "Chunk upload failed" }, { status: 500 })
  }
}
