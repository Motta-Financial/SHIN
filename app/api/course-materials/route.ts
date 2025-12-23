import { createClient } from "@/lib/supabase/server"
import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const clinic = searchParams.get("clinic")
    const category = searchParams.get("category")

    let query = supabase.from("course_materials").select("*").order("created_at", { ascending: false })

    // Filter by clinic if specified (also include 'all' materials)
    if (clinic && clinic !== "all") {
      query = query.or(`target_clinic.eq.${clinic},target_clinic.eq.all`)
    }

    // Filter by category if specified
    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching course materials:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ materials: data || [] })
  } catch (error) {
    console.error("Error in course materials GET:", error)
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()

    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const targetClinic = (formData.get("targetClinic") as string) || "all"
    const category = (formData.get("category") as string) || "resource"
    const uploadedByName = formData.get("uploadedByName") as string
    const uploadedByEmail = formData.get("uploadedByEmail") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`course-materials/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    // Store metadata in Supabase
    const { data, error } = await supabase
      .from("course_materials")
      .insert({
        title,
        description,
        file_name: file.name,
        file_url: blob.url,
        file_type: file.type,
        file_size: file.size,
        target_clinic: targetClinic,
        category,
        uploaded_by_name: uploadedByName,
        uploaded_by_email: uploadedByEmail,
      })
      .select()
      .single()

    if (error) {
      // If database insert fails, try to delete the blob
      await del(blob.url).catch(console.error)
      console.error("Error inserting course material:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ material: data })
  } catch (error) {
    console.error("Error uploading course material:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { id, fileUrl } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Material ID is required" }, { status: 400 })
    }

    // Delete from Supabase
    const { error } = await supabase.from("course_materials").delete().eq("id", id)

    if (error) {
      console.error("Error deleting course material:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Delete from Vercel Blob
    if (fileUrl) {
      await del(fileUrl).catch(console.error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting course material:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
