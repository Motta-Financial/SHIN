import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// PATCH - Update document metadata (title, submission type)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { fileName, submissionType } = body

    console.log("[v0] Updating document:", id, { fileName, submissionType })

    const supabase = await createClient()

    const updateData: Record<string, string> = {}
    if (fileName) updateData.file_name = fileName
    if (submissionType) updateData.submission_type = submissionType

    const { data, error } = await supabase.from("documents").update(updateData).eq("id", id).select()

    if (error) {
      console.error("[v0] Error updating document:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.error("[v0] Document not found:", id)
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 })
    }

    console.log("[v0] Document updated successfully:", data[0])
    return NextResponse.json({ success: true, data: data[0] })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/documents/[id]:", error)
    return NextResponse.json({ success: false, error: "Failed to update document" }, { status: 500 })
  }
}

// DELETE - Delete a document
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    console.log("[v0] Deleting document:", id)

    const supabase = await createClient()

    const { data: docs } = await supabase.from("documents").select("file_url").eq("id", id)
    const doc = docs?.[0]

    const { error } = await supabase.from("documents").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting document:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (doc?.file_url) {
      try {
        const url = new URL(doc.file_url)
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/)
        if (pathMatch) {
          const [, bucket, filePath] = pathMatch
          await supabase.storage.from(bucket).remove([filePath])
        }
      } catch (storageError) {
        console.warn("[v0] Could not delete file from storage:", storageError)
      }
    }

    console.log("[v0] Document deleted successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/documents/[id]:", error)
    return NextResponse.json({ success: false, error: "Failed to delete document" }, { status: 500 })
  }
}
