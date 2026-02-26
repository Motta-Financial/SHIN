import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseQueryWithRetry } from "@/lib/supabase-retry"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("documentId")
    const clientId = searchParams.get("clientId")
    const evaluationType = searchParams.get("evaluationType")
    const finalizedOnly = searchParams.get("finalizedOnly") === "true"
    const finalized = searchParams.get("finalized") === "true"

    const { data, error: queryError } = await supabaseQueryWithRetry(
      () => {
        let query = supabase.from("evaluations").select("*").order("created_at", { ascending: false })
        if (documentId) query = query.eq("document_id", documentId)
        else if (clientId) query = query.eq("client_id", clientId)
        if (evaluationType) query = query.eq("evaluation_type", evaluationType)
        if (finalizedOnly || finalized) query = query.not("final_grade", "is", null)
        return query
      },
      3,
      "evaluations",
    )

    if (queryError) {
      return NextResponse.json({ evaluations: [] })
    }

    const evaluationsWithAvg = (data || []).map((e) => {
      const ratings = [
        e.question_1_rating,
        e.question_2_rating,
        e.question_3_rating,
        e.question_4_rating,
        e.question_5_rating,
      ].filter((r) => r !== null && r !== undefined)

      const average_rating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0

      return { ...e, average_rating }
    })

    return NextResponse.json({ evaluations: evaluationsWithAvg })
  } catch (error) {
    console.error("Error in evaluations GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      document_id,
      documentId,
      client_id,
      director_name,
      directorName,
      evaluation_type,
      evaluationType,
      question_1_rating,
      question1Rating,
      question_2_rating,
      question2Rating,
      question_3_rating,
      question3Rating,
      question_4_rating,
      question4Rating,
      question_5_rating,
      question5Rating,
      question_1_notes,
      question1Notes,
      question_2_notes,
      question2Notes,
      question_3_notes,
      question3Notes,
      question_4_notes,
      question4Notes,
      question_5_notes,
      question5Notes,
      additional_comments,
      additionalComments,
    } = body

    const finalDocumentId = document_id || documentId
    const finalClientId = client_id
    const finalDirectorName = director_name || directorName
    const finalEvaluationType = evaluation_type || evaluationType || "midterm"
    const finalQ1Rating = question_1_rating ?? question1Rating
    const finalQ2Rating = question_2_rating ?? question2Rating
    const finalQ3Rating = question_3_rating ?? question3Rating
    const finalQ4Rating = question_4_rating ?? question4Rating
    const finalQ5Rating = question_5_rating ?? question5Rating
    const finalQ1Notes = question_1_notes ?? question1Notes
    const finalQ2Notes = question_2_notes ?? question2Notes
    const finalQ3Notes = question_3_notes ?? question3Notes
    const finalQ4Notes = question_4_notes ?? question4Notes
    const finalQ5Notes = question_5_notes ?? question5Notes
    const finalAdditionalComments = additional_comments ?? additionalComments

    if (!finalDirectorName) {
      return NextResponse.json({ error: "Director name is required" }, { status: 400 })
    }

    if (!finalDocumentId && !finalClientId) {
      return NextResponse.json({ error: "Either document_id or client_id is required" }, { status: 400 })
    }

    const ratings = [finalQ1Rating, finalQ2Rating, finalQ3Rating, finalQ4Rating, finalQ5Rating]
    if (ratings.some((r) => r !== undefined && r !== null && (typeof r !== "number" || r < 1 || r > 5))) {
      return NextResponse.json({ error: "Ratings must be between 1 and 5" }, { status: 400 })
    }

    let existingQuery = supabase
      .from("evaluations")
      .select("id")
      .eq("director_name", finalDirectorName)
      .eq("evaluation_type", finalEvaluationType)

    if (finalDocumentId) {
      existingQuery = existingQuery.eq("document_id", finalDocumentId)
    } else if (finalClientId) {
      existingQuery = existingQuery.eq("client_id", finalClientId)
    }

    const { data: existing } = await existingQuery.single()

    const evaluationData = {
      document_id: finalDocumentId || null,
      client_id: finalClientId || null,
      director_name: finalDirectorName.trim(),
      evaluation_type: finalEvaluationType,
      question_1_rating: finalQ1Rating,
      question_2_rating: finalQ2Rating,
      question_3_rating: finalQ3Rating,
      question_4_rating: finalQ4Rating,
      question_5_rating: finalQ5Rating,
      question_1_notes: finalQ1Notes?.trim() || null,
      question_2_notes: finalQ2Notes?.trim() || null,
      question_3_notes: finalQ3Notes?.trim() || null,
      question_4_notes: finalQ4Notes?.trim() || null,
      question_5_notes: finalQ5Notes?.trim() || null,
      additional_comments: finalAdditionalComments?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      const { data, error: updateError } = await supabase
        .from("evaluations")
        .update(evaluationData)
        .eq("id", existing.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating evaluation:", updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      const ratings = [
        data.question_1_rating,
        data.question_2_rating,
        data.question_3_rating,
        data.question_4_rating,
        data.question_5_rating,
      ].filter((r) => r !== null)
      const average_rating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0

      return NextResponse.json({ evaluation: { ...data, average_rating } })
    } else {
      const { data, error: insertError } = await supabase.from("evaluations").insert(evaluationData).select().single()

      if (insertError) {
        console.error("Error creating evaluation:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      const ratings = [
        data.question_1_rating,
        data.question_2_rating,
        data.question_3_rating,
        data.question_4_rating,
        data.question_5_rating,
      ].filter((r) => r !== null)
      const average_rating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0

      return NextResponse.json({ evaluation: { ...data, average_rating } })
    }
  } catch (error) {
    console.error("Error in evaluations POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      evaluationId,
      evaluation_id,
      clientId,
      client_id,
      final_grade,
      finalGrade,
      final_feedback,
      finalFeedback,
      finalized_by,
      finalizedBy,
      evaluation_type,
      evaluationType,
    } = body

    const finalEvaluationId = evaluationId || evaluation_id
    const finalClientId = clientId || client_id
    const grade = final_grade ?? finalGrade
    const feedback = final_feedback ?? finalFeedback
    const finalizer = finalized_by ?? finalizedBy ?? "Nick Vadala"
    const evalType = evaluation_type ?? evaluationType ?? "midterm"

    if (!finalEvaluationId && !finalClientId) {
      return NextResponse.json({ error: "Either evaluation_id or client_id is required" }, { status: 400 })
    }

    if (grade !== undefined && (typeof grade !== "number" || grade < 0 || grade > 100)) {
      return NextResponse.json({ error: "Grade must be between 0 and 100" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (grade !== undefined) {
      updateData.final_grade = grade
      updateData.finalized_at = new Date().toISOString()
      updateData.finalized_by = finalizer
    }

    if (feedback !== undefined) {
      updateData.final_feedback = feedback
    }

    if (evalType) {
      updateData.evaluation_type = evalType
    }

    let query = supabase.from("evaluations").update(updateData)

    if (finalEvaluationId) {
      query = query.eq("id", finalEvaluationId)
    } else if (finalClientId) {
      query = query.eq("client_id", finalClientId)
    }

    const { data, error: updateError } = await query.select()

    if (updateError) {
      console.error("Error finalizing grade:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      evaluations: data,
      message: `Grade finalized successfully by ${finalizer}`,
    })
  } catch (error) {
    console.error("Error in evaluations PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
