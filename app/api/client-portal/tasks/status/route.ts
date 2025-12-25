import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { taskId, status, updatedBy, updatedByType } = body

    if (!taskId || !status) {
      return NextResponse.json({ error: "Missing taskId or status" }, { status: 400 })
    }

    // Update the task status
    const { data, error } = await supabase
      .from("client_tasks")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select()
      .single()

    if (error) {
      console.error("Error updating task status:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Add a comment noting the status change
    await supabase.from("task_comments").insert({
      task_id: taskId,
      comment_text: `Status changed to "${status}" by ${updatedBy}`,
      author_name: updatedBy || "System",
      author_email: "",
      author_type: updatedByType || "system",
    })

    return NextResponse.json({ task: data })
  } catch (error) {
    console.error("Error in task status update:", error)
    return NextResponse.json({ error: "Failed to update task status" }, { status: 500 })
  }
}
