import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-middleware"

export async function GET(request: NextRequest) {
  try {
    const { authorized, error } = await requireAuth()
    if (!authorized) return error

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("documentId")

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    const { data, error: queryError } = await supabase
      .from("evaluations")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false })

    if (queryError) {
      console.error("Error fetching evaluations:", queryError)
      return NextResponse.json({ error: queryError.message }, { status: 500 })
    }

    return NextResponse.json({ evaluations: data || [] })
  } catch (error) {
    console.error("Error in evaluations GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, error } = await requireAuth()
    if (!authorized) return error

    const supabase = await createClient()
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

    if (typeof directorName !== "string" || directorName.length > 255) {
      return NextResponse.json({ error: "Invalid director name" }, { status: 400 })
    }

    const ratings = [question1Rating, question2Rating, question3Rating, question4Rating, question5Rating]
    if (ratings.some((r) => r !== undefined && (typeof r !== "number" || r < 1 || r > 5))) {
      return NextResponse.json({ error: "Ratings must be between 1 and 5" }, { status: 400 })
    }

    // Check if evaluation already exists
    const { data: existing } = await supabase
      .from("evaluations")
      .select("id")
      .eq("document_id", documentId)
      .eq("director_name", directorName)
      .single()

    if (existing) {
      const { data, error: updateError } = await supabase
        .from("evaluations")
        .update({
          question_1_rating: question1Rating,
          question_2_rating: question2Rating,
          question_3_rating: question3Rating,
          question_4_rating: question4Rating,
          question_5_rating: question5Rating,
          question_1_notes: question1Notes?.trim(),
          question_2_notes: question2Notes?.trim(),
          question_3_notes: question3Notes?.trim(),
          question_4_notes: question4Notes?.trim(),
          question_5_notes: question5Notes?.trim(),
          additional_comments: additionalComments?.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating evaluation:", updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ evaluation: data })
    } else {
      const { data, error: insertError } = await supabase
        .from("evaluations")
        .insert({
          document_id: documentId,
          director_name: directorName.trim(),
          question_1_rating: question1Rating,
          question_2_rating: question2Rating,
          question_3_rating: question3Rating,
          question_4_rating: question4Rating,
          question_5_rating: question5Rating,
          question_1_notes: question1Notes?.trim(),
          question_2_notes: question2Notes?.trim(),
          question_3_notes: question3Notes?.trim(),
          question_4_notes: question4Notes?.trim(),
          question_5_notes: question5Notes?.trim(),
          additional_comments: additionalComments?.trim(),
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error creating evaluation:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ evaluation: data })
    }
  } catch (error) {
    console.error("Error in evaluations POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
