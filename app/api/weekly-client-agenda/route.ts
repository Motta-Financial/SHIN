import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.supabase_SUPABASE_URL!,
  process.env.supabase_SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const weekEnding = searchParams.get("weekEnding")
  const clinic = searchParams.get("clinic")

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
    console.error("[v0] Error fetching weekly client agenda:", error)
    return NextResponse.json({ error: "Failed to fetch agenda" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { client_name, week_ending, clinic, notes, order_index } = body

    if (!client_name || !week_ending) {
      return NextResponse.json({ error: "Client name and week ending are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("weekly_client_agenda")
      .insert({
        client_name,
        week_ending,
        clinic,
        notes,
        order_index: order_index || 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error("[v0] Error adding client to agenda:", error)
    return NextResponse.json({ error: "Failed to add client" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, notes, order_index } = body

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const updateData: any = { updated_at: new Date().toISOString() }
    if (notes !== undefined) updateData.notes = notes
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
    console.error("[v0] Error updating client agenda:", error)
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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
    console.error("[v0] Error deleting client from agenda:", error)
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 })
  }
}
