import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("documentId")

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("evaluations")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching evaluations:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ evaluations: data || [] })
  } catch (error) {
    console.error("[v0] Error in evaluations GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      documentId,
      directorName,
      question1Rating,
      question2Rating,
      question3Rating,
      question4Rating,
      question5Rating,
      question1Notes,
      question2Notes,
      question3Notes,
      question4Notes,
      question5Notes,
      additionalComments,
    } = body

    if (!documentId || !directorName) {
      return NextResponse.json({ error: "Document ID and director name are required" }, { status: 400 })
    }

    // Check if evaluation already exists
    const { data: existing } = await supabase
      .from("evaluations")
      .select("id")
      .eq("document_id", documentId)
      .eq("director_name", directorName)
      .single()

    if (existing) {
      const { data, error } = await supabase
        .from("evaluations")
        .update({
          question_1_rating: question1Rating,
          question_2_rating: question2Rating,
          question_3_rating: question3Rating,
          question_4_rating: question4Rating,
          question_5_rating: question5Rating,
          question_1_notes: question1Notes,
          question_2_notes: question2Notes,
          question_3_notes: question3Notes,
          question_4_notes: question4Notes,
          question_5_notes: question5Notes,
          additional_comments: additionalComments,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (error) {
        console.error("[v0] Error updating evaluation:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ evaluation: data })
    } else {
      const { data, error } = await supabase
        .from("evaluations")
        .insert({
          document_id: documentId,
          director_name: directorName,
          question_1_rating: question1Rating,
          question_2_rating: question2Rating,
          question_3_rating: question3Rating,
          question_4_rating: question4Rating,
          question_5_rating: question5Rating,
          question_1_notes: question1Notes,
          question_2_notes: question2Notes,
          question_3_notes: question3Notes,
          question_4_notes: question4Notes,
          question_5_notes: question5Notes,
          additional_comments: additionalComments,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error creating evaluation:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ evaluation: data })
    }
  } catch (error) {
    console.error("[v0] Error in evaluations POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
