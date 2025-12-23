import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET - Fetch documents for a student
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentName = searchParams.get("studentName")

    const supabase = await createClient()

    let query = supabase
      .from("documents")
      .select(`
        id,
        student_name,
        client_name,
        file_name,
        file_url,
        file_type,
        submission_type,
        description,
        clinic,
        semester,
        uploaded_at,
        uploaded_by_user_id
      `)
      .order("uploaded_at", { ascending: false })

    if (studentName) {
      query = query.eq("student_name", studentName)
    }

    const { data: documents, error } = await query

    if (error) {
      console.error("[v0] Error fetching documents:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Get reviews for these documents
    const documentIds = documents?.map((d) => d.id) || []

    if (documentIds.length > 0) {
      const { data: reviews } = await supabase
        .from("document_reviews")
        .select(`
          id,
          document_id,
          grade,
          comment,
          director_name,
          created_at
        `)
        .in("document_id", documentIds)

      // Attach reviews to documents
      const documentsWithReviews = documents?.map((doc) => ({
        ...doc,
        reviews: reviews?.filter((r) => r.document_id === doc.id) || [],
      }))

      return NextResponse.json({ success: true, documents: documentsWithReviews || [] })
    }

    return NextResponse.json({ success: true, documents: documents || [] })
  } catch (error) {
    console.error("[v0] Error in documents API:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch documents" }, { status: 500 })
  }
}

// POST - Upload a new document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studentName,
      clientName,
      fileUrl,
      fileName,
      fileType,
      submissionType,
      description,
      clinic,
      semester = "Fall 2025",
    } = body

    if (!studentName || !clientName || !fileUrl || !fileName) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("documents")
      .insert({
        student_name: studentName,
        client_name: clientName,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType || fileName.split(".").pop() || "unknown",
        submission_type: submissionType || "other",
        description,
        clinic,
        semester,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating document:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, document: data })
  } catch (error) {
    console.error("[v0] Error in document POST:", error)
    return NextResponse.json({ success: false, error: "Failed to create document" }, { status: 500 })
  }
}
