import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { getCachedData, setCachedData } from "@/lib/api-cache"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get("userEmail")
    const userType = searchParams.get("userType")

    const cacheKey = `agreements:${userEmail || "all"}:${userType || "all"}`
    const cached = getCachedData(cacheKey)
    if (cached) {
      console.log("[v0] Agreements API - Returning cached response")
      return NextResponse.json(cached)
    }

    const supabase = createServiceClient()

    let query = supabase.from("signed_agreements").select("*").order("signed_at", { ascending: false })

    if (userEmail) {
      query = query.eq("user_email", userEmail)
    }
    if (userType) {
      query = query.eq("user_type", userType)
    }

    const { data, error } = await query

    if (error) throw error

    const response = { agreements: data }
    setCachedData(cacheKey, response)
    console.log(`[v0] Agreements API - Fetched and cached agreements count: ${data?.length || 0}`)

    return NextResponse.json(response)
  } catch (error: any) {
    const errorMessage = error?.message || String(error)
    console.error("Error fetching agreements:", errorMessage)

    // Check if it's a rate limit error
    if (errorMessage.includes("Too Many") || errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      return NextResponse.json(
        { agreements: [], error: "Rate limited, please retry", rateLimited: true },
        { status: 429 },
      )
    }

    return NextResponse.json({ agreements: [], error: errorMessage })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { agreementType, userName, userEmail, userType, signature, signedAt, programName, clientName } = body

    const { data, error } = await supabase
      .from("signed_agreements")
      .insert({
        agreement_type: agreementType,
        user_name: userName,
        user_email: userEmail,
        user_type: userType,
        signature,
        signed_at: signedAt,
        program_name: programName,
        client_name: clientName,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error saving agreement:", error)
    return NextResponse.json({ error: "Failed to save agreement" }, { status: 500 })
  }
}
