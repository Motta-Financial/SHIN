import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")

    if (!clientId) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: questions, error } = await supabase
      .from("client_questions")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching questions:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, questions: questions || [] })
  } catch (error) {
    console.error("Error in questions API:", error)
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { clientId, question, askedBy, askedByEmail, category } = body

    if (!clientId || !question || !askedBy || !askedByEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: newQuestion, error } = await supabase
      .from("client_questions")
      .insert({
        client_id: clientId,
        question,
        asked_by: askedBy,
        asked_by_email: askedByEmail,
        category: category || "general",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating question:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, question: newQuestion })
  } catch (error) {
    console.error("Error in questions POST:", error)
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { questionId, answer, answeredBy, status } = body

    if (!questionId) {
      return NextResponse.json({ error: "Question ID required" }, { status: 400 })
    }

    const updateData: any = { updated_at: new Date().toISOString() }
    if (answer) {
      updateData.answer = answer
      updateData.answered_by = answeredBy
      updateData.answered_at = new Date().toISOString()
      updateData.status = "answered"
    }
    if (status) updateData.status = status

    const { data: updatedQuestion, error } = await supabase
      .from("client_questions")
      .update(updateData)
      .eq("id", questionId)
      .select()
      .single()

    if (error) {
      console.error("Error updating question:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, question: updatedQuestion })
  } catch (error) {
    console.error("Error in questions PATCH:", error)
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 })
  }
}
