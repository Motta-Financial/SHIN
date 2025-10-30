import { createClient } from "@/lib/supabase-client"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("documentId")

    if (!documentId) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 })
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from("document_reviews")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching reviews:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reviews: data || [] })
  } catch (error) {
    console.error("[v0] Error in reviews API:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { documentId, directorName, comment, grade } = body

    if (!documentId || !directorName || (!comment && !grade)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from("document_reviews")
      .insert({
        document_id: documentId,
        director_name: directorName,
        comment: comment || "",
        grade: grade || "",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving review:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ review: data })
  } catch (error) {
    console.error("[v0] Error in reviews POST:", error)
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 })
  }
}
