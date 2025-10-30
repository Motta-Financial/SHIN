import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const clinic = searchParams.get("clinic")

    let query = supabase
      .from("agenda_items")
      .select("*")
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date", { ascending: true })
      .order("time", { ascending: true })
      .limit(10)

    // Filter by clinic if specified
    if (clinic && clinic !== "all") {
      query = query.or(`clinic.eq.${clinic},clinic.is.null`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching agenda items:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data || [] })
  } catch (error) {
    console.error("[v0] Error in agenda GET:", error)
    return NextResponse.json({ error: "Failed to fetch agenda items" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("agenda_items")
      .insert({
        title: body.title,
        description: body.description,
        date: body.date,
        time: body.time,
        type: body.type || "event",
        clinic: body.clinic,
        created_by: body.created_by,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating agenda item:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error("[v0] Error in agenda POST:", error)
    return NextResponse.json({ error: "Failed to create agenda item" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, ...updates } = body

    const { data, error } = await supabase
      .from("agenda_items")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating agenda item:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error("[v0] Error in agenda PATCH:", error)
    return NextResponse.json({ error: "Failed to update agenda item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })
    }

    const { error } = await supabase.from("agenda_items").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting agenda item:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in agenda DELETE:", error)
    return NextResponse.json({ error: "Failed to delete agenda item" }, { status: 500 })
  }
}
