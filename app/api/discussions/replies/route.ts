import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, content, authorName, authorEmail, authorType } = body

    const { data, error } = await supabase
      .from("discussion_replies")
      .insert({
        post_id: postId,
        content,
        author_name: authorName,
        author_email: authorEmail,
        author_type: authorType,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating reply:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, reply: data })
  } catch (error) {
    console.error("Error in replies POST:", error)
    return NextResponse.json({ error: "Failed to create reply" }, { status: 500 })
  }
}
