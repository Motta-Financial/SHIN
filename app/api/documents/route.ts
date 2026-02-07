import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { getCachedData, setCachedData } from "@/lib/api-cache"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get("client")
    const clientId = searchParams.get("clientId")
    const submissionType = searchParams.get("submissionType")
    const semesterId = searchParams.get("semesterId")
    const includeAll = searchParams.get("includeAll") === "true"

    const cacheKey = `documents-${clientId || "all"}-${clientName || "all"}-${submissionType || "all"}-${semesterId || "default"}-${includeAll}`
    const cached = getCachedData(cacheKey)
    if (cached) {
      console.log("[v0] Documents API - Returning cached response")
      return NextResponse.json(cached)
    }

    const supabase = await createClient()

    // Get active semester if not specified and not including all
    let activeSemesterId = semesterId
    if (!activeSemesterId && !includeAll) {
      try {
        const serviceClient = createServiceClient()
        const { data: activeSemester } = await serviceClient
          .from("semester_config")
          .select("id")
          .eq("is_active", true)
          .maybeSingle()
        activeSemesterId = activeSemester?.id || null
      } catch (err) {
        console.error("[v0] Error fetching active semester:", err)
      }
    }

    let query = supabase.from("documents").select("*").order("uploaded_at", { ascending: false })

    // Filter by active semester (Spring 2026) by default
    if (activeSemesterId) {
      query = query.eq("semester_id", activeSemesterId)
    }

    if (clientId && clientId !== "all") {
      query = query.eq("client_id", clientId)
    } else if (clientName && clientName !== "all") {
      query = query.eq("client_name", clientName)
    }

    if (submissionType && submissionType !== "all") {
      query = query.eq("submission_type", submissionType)
    }

    const { data, error } = await query

    if (error) {
      const msg = error.message || ""
      if (msg.includes("Too Many R") || msg.includes("rate limit")) {
        return NextResponse.json({ error: "Rate limited", documents: [] }, { status: 429 })
      }
      console.error("[v0] Error fetching documents:", error)
      return NextResponse.json({ error: error.message, documents: [] }, { status: 500 })
    }

    const result = { documents: data || [] }
    setCachedData(cacheKey, result, 30000)
    return NextResponse.json(result)
  } catch (error: any) {
    const msg = error?.message || ""
    if (msg.includes("Too Many R") || msg.includes("Unexpected token") || msg.includes("rate limit")) {
      return NextResponse.json({ error: "Rate limited", documents: [] }, { status: 429 })
    }
    console.error("[v0] Error in documents API:", error)
    return NextResponse.json({ error: "Failed to fetch documents", documents: [] }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      studentId,
      studentName,
      clientId,
      clientName,
      fileUrl,
      fileName,
      fileType,
      description,
      clinic,
      submissionType,
      semesterId,
    } = body

    if (!fileUrl || !fileName) {
      return NextResponse.json({ error: "Missing required fields: fileUrl and fileName" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get active semester if not provided
    let activeSemesterId = semesterId
    if (!activeSemesterId) {
      try {
        const serviceClient = createServiceClient()
        const { data: activeSemester } = await serviceClient
          .from("semester_config")
          .select("id")
          .eq("is_active", true)
          .maybeSingle()
        activeSemesterId = activeSemester?.id || null
      } catch (err) {
        console.error("[v0] Error fetching active semester:", err)
      }
    }

    const insertData: Record<string, any> = {
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType || fileName.split(".").pop() || "unknown",
      description: description || "",
      clinic: clinic || "",
      submission_type: submissionType || "document",
      uploaded_at: new Date().toISOString(),
      semester_id: activeSemesterId,
    }

    // Add optional foreign key references if provided
    if (clientId) insertData.client_id = clientId
    if (clientName) insertData.client_name = clientName
    if (studentId) insertData.student_id = studentId
    if (studentName) insertData.student_name = studentName

    const { data, error } = await supabase.from("documents").insert(insertData).select().single()

    if (error) {
      console.error("[v0] Error saving document:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ document: data })
  } catch (error) {
    console.error("[v0] Error in documents POST:", error)
    return NextResponse.json({ error: "Failed to save document" }, { status: 500 })
  }
}
