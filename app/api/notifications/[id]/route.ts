import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { is_read } = body

    const { error } = await supabase.from("notifications").update({ is_read }).eq("id", params.id)

    if (error) {
      console.error("Error updating notification:", error)
      return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in notification update API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
