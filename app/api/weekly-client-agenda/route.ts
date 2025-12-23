import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams
  const weekEnding = searchParams.get("weekEnding")
  const clinic = searchParams.get("clinic")

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!weekEnding) {
    return NextResponse.json({ error: "Week ending is required" }, { status: 400 })
  }

  try {
    let query = supabase
      .from("weekly_client_agenda")
      .select("*")
      .eq("week_ending", weekEnding)
      .order("order_index", { ascending: true })

    if (clinic && clinic !== "all") {
      query = query.eq("clinic", clinic)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ items: data || [] })
  } catch (error) {
    console.error("Error fetching weekly client agenda:", error)
    return NextResponse.json({ error: "Failed to fetch agenda" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role, is_admin").eq("id", user.id).single()

    if (!profile?.is_admin && profile?.role !== "director") {
      return NextResponse.json({ error: "Forbidden: Admin or Director access required" }, { status: 403 })
    }

    const body = await request.json()
    const { client_name, week_ending, clinic, notes, order_index } = body

    if (!client_name || !week_ending) {
      return NextResponse.json({ error: "Client name and week ending are required" }, { status: 400 })
    }

    if (typeof client_name !== "string" || client_name.length > 255) {
      return NextResponse.json({ error: "Invalid client name" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("weekly_client_agenda")
      .insert({
        client_name: client_name.trim(),
        week_ending,
        clinic: clinic?.trim() || null,
        notes: notes?.trim() || null,
        order_index: order_index || 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error("Error adding client to agenda:", error)
    return NextResponse.json({ error: "Failed to add client" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role, is_admin").eq("id", user.id).single()

    if (!profile?.is_admin && profile?.role !== "director") {
      return NextResponse.json({ error: "Forbidden: Admin or Director access required" }, { status: 403 })
    }

    const body = await request.json()
    const { id, notes, order_index } = body

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (notes !== undefined) updateData.notes = typeof notes === "string" ? notes.trim() : notes
    if (order_index !== undefined) updateData.order_index = order_index

    const { data, error } = await supabase
      .from("weekly_client_agenda")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error("Error updating client agenda:", error)
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase.from("profiles").select("role, is_admin").eq("id", user.id).single()

  if (!profile?.is_admin && profile?.role !== "director") {
    return NextResponse.json({ error: "Forbidden: Admin or Director access required" }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 })
  }

  try {
    const { error } = await supabase.from("weekly_client_agenda").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting client from agenda:", error)
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 })
  }
}
