import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { questionId, answer, answeredBy } = body

    if (!questionId || !answer) {
      return NextResponse.json({ error: "Missing questionId or answer" }, { status: 400 })
    }

    // Update the question with the answer
    const { data, error } = await supabase
      .from("client_questions")
      .update({
        answer,
        answered_by: answeredBy,
        answered_at: new Date().toISOString(),
        status: "answered",
      })
      .eq("id", questionId)
      .select()
      .single()

    if (error) {
      console.error("Error answering question:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ question: data })
  } catch (error) {
    console.error("Error in question answer:", error)
    return NextResponse.json({ error: "Failed to answer question" }, { status: 500 })
  }
}
