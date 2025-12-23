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

    // Get tasks for this client
    const { data: tasks, error } = await supabase
      .from("client_tasks")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tasks:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get comments for each task
    const tasksWithComments = await Promise.all(
      (tasks || []).map(async (task) => {
        const { data: comments } = await supabase
          .from("client_task_comments")
          .select("*")
          .eq("task_id", task.id)
          .order("created_at", { ascending: true })

        return { ...task, comments: comments || [] }
      }),
    )

    return NextResponse.json({ success: true, tasks: tasksWithComments })
  } catch (error) {
    console.error("Error in tasks API:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { clientId, title, description, priority, dueDate, assignedTo, assignedToId, createdBy, createdByType } = body

    if (!clientId || !title || !createdBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: task, error } = await supabase
      .from("client_tasks")
      .insert({
        client_id: clientId,
        title,
        description: description || "",
        priority: priority || "medium",
        due_date: dueDate || null,
        assigned_to: assignedTo || null,
        assigned_to_id: assignedToId || null,
        created_by: createdBy,
        created_by_type: createdByType || "admin",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating task:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, task })
  } catch (error) {
    console.error("Error in tasks POST:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { taskId, status, title, description, priority, dueDate } = body

    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 })
    }

    const updateData: any = { updated_at: new Date().toISOString() }
    if (status) updateData.status = status
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (priority) updateData.priority = priority
    if (dueDate !== undefined) updateData.due_date = dueDate

    const { data: task, error } = await supabase
      .from("client_tasks")
      .update(updateData)
      .eq("id", taskId)
      .select()
      .single()

    if (error) {
      console.error("Error updating task:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, task })
  } catch (error) {
    console.error("Error in tasks PATCH:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}
