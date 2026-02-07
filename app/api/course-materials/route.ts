import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  try {
    const { searchParams } = new URL(request.url)
    const clinic = searchParams.get("clinic")
    const category = searchParams.get("category")

    let query = supabase.from("course_materials").select("*").order("created_at", { ascending: false })

    if (clinic && clinic !== "all") {
      query = query.or(`target_clinic.eq.${clinic},target_clinic.eq.all`)
    }

    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    const { data, error } = await query

    if (error) {
      const msg = error.message || ""
      if (msg.includes("Too Many R") || msg.includes("rate limit")) {
        return NextResponse.json({ success: false, error: "Rate limited", materials: [] }, { status: 429 })
      }
      console.error("Error fetching course materials:", error)
      return NextResponse.json({ success: false, error: error.message, materials: [] }, { status: 500 })
    }

    return NextResponse.json({ success: true, materials: data || [] })
  } catch (error: any) {
    const msg = error?.message || ""
    if (msg.includes("Too Many R") || msg.includes("Unexpected token") || msg.includes("rate limit")) {
      return NextResponse.json({ success: false, error: "Rate limited", materials: [] }, { status: 429 })
    }
    console.error("Error in course materials GET:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch materials", materials: [] }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  try {
    const formData = await request.formData()

    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const targetClinic = (formData.get("targetClinic") as string) || "all"
    const category = (formData.get("category") as string) || "resource"
    const uploadedBy = formData.get("uploadedBy") as string
    const uploaderName = formData.get("uploaderName") as string

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`course-materials/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

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
        uploaded_by: uploadedBy,
        uploader_name: uploaderName,
      })
      .select()
      .single()

    if (error) {
      // If database insert fails, try to delete the blob
      await del(blob.url).catch(console.error)
      console.error("Error inserting course material:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, material: data })
  } catch (error) {
    console.error("Error uploading course material:", error)
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  try {
    const { id, fileUrl } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: "Material ID is required" }, { status: 400 })
    }

    // Delete from Supabase
    const { error } = await supabase.from("course_materials").delete().eq("id", id)

    if (error) {
      console.error("Error deleting course material:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Delete from Vercel Blob
    if (fileUrl) {
      await del(fileUrl).catch(console.error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting course material:", error)
    return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 })
  }
}
