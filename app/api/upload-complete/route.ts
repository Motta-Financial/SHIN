import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { uploadId, fileName, fileSize, clientName, studentName, submissionType, chunkUrls } = body

    if (!uploadId || !fileName || !chunkUrls || chunkUrls.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`[v0] Completing upload for ${fileName} with ${chunkUrls.length} chunks`)

    const supabase = createClient()

    // Store document metadata in Supabase
    const { data, error } = await supabase
      .from("documents")
      .insert({
        student_name: studentName || "Unknown",
        client_name: clientName || "Unknown",
        file_url: chunkUrls[0], // Store first chunk URL as primary
        file_name: fileName,
        file_type: fileName.split(".").pop() || "unknown",
        submission_type: submissionType || "Other",
        chunk_urls: chunkUrls, // Store all chunk URLs as JSON array
        upload_id: uploadId,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to save document metadata" }, { status: 500 })
    }

    console.log(`[v0] Upload completed successfully for ${fileName}`)

    return NextResponse.json({
      success: true,
      documentId: data.id,
      message: "Upload completed successfully",
    })
  } catch (error: any) {
    console.error("[v0] Upload completion error:", error.message || error)
    return NextResponse.json({ error: error?.message || "Failed to complete upload" }, { status: 500 })
  }
}
