import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { taskId, clientId, commentText, authorName, authorEmail, authorType } = body

    if (!taskId || !commentText || !authorName || !authorEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: comment, error } = await supabase
      .from("client_task_comments")
      .insert({
        task_id: taskId,
        client_id: clientId,
        comment_text: commentText,
        author_name: authorName,
        author_email: authorEmail,
        author_type: authorType || "client",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating comment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, comment })
  } catch (error) {
    console.error("Error in comments POST:", error)
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: comments, error } = await supabase
      .from("client_task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching comments:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, comments: comments || [] })
  } catch (error) {
    console.error("Error in comments GET:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}
