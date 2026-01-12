import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCachedData, setCachedData } from "@/lib/api-cache"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email || email === "null" || email === "undefined") {
      return NextResponse.json({ documents: [] })
    }

    const cacheKey = `client-documents:${email}`
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      console.log("[v0] Client Documents API - Returning cached response")
      return NextResponse.json(cachedData)
    }

    const supabase = await createClient()

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (clientError) {
      console.error("Error fetching client:", clientError)
      return NextResponse.json({ documents: [] })
    }

    if (!client) {
      return NextResponse.json({ documents: [] })
    }

    // Get documents uploaded by this client
    const { data: documents, error } = await supabase
      .from("client_documents")
      .select("*")
      .eq("uploaded_by_email", email)
      .order("uploaded_at", { ascending: false })

    if (error) {
      console.error("Error fetching client documents:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const response = { documents: documents || [] }
    setCachedData(cacheKey, response)
    console.log("[v0] Client Documents API - Fetched and cached documents count:", documents?.length || 0)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in client-documents API:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { file_name, file_url, file_type, description, uploaded_by_email, uploaded_by_name, client_id } = body

    if (!file_name || !file_url || !uploaded_by_email || !client_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("client_documents")
      .insert({
        file_name,
        file_url,
        file_type,
        description: description || "",
        uploaded_by_email,
        uploaded_by_name,
        client_id,
        is_visible_to_students: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving client document:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ document: data })
  } catch (error) {
    console.error("Error in client-documents POST:", error)
    return NextResponse.json({ error: "Failed to save document" }, { status: 500 })
  }
}
