import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const contextType = searchParams.get("contextType") // "client" or "clinic"
    const contextId = searchParams.get("contextId")

    if (!contextType || !contextId) {
      return NextResponse.json({ posts: [] })
    }

    // Fetch posts with replies
    const { data: posts, error } = await supabase
      .from("discussion_posts")
      .select(`
        *,
        replies:discussion_replies(*)
      `)
      .eq("context_type", contextType)
      .eq("context_id", contextId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching discussions:", error)
      return NextResponse.json({ posts: [] })
    }

    return NextResponse.json({ posts: posts || [] })
  } catch (error) {
    console.error("Error in discussions GET:", error)
    return NextResponse.json({ posts: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { contextType, contextId, title, content, authorName, authorEmail, authorType } = body

    const { data, error } = await supabase
      .from("discussion_posts")
      .insert({
        context_type: contextType,
        context_id: contextId,
        title,
        content,
        author_name: authorName,
        author_email: authorEmail,
        author_type: authorType,
        is_pinned: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating post:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, post: data })
  } catch (error) {
    console.error("Error in discussions POST:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
