import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

function getSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get("userEmail")
    const userType = searchParams.get("userType")

    let query = supabase.from("signed_agreements").select("*").order("signed_at", { ascending: false })

    if (userEmail) {
      query = query.eq("user_email", userEmail)
    }
    if (userType) {
      query = query.eq("user_type", userType)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ agreements: data })
  } catch (error) {
    console.error("Error fetching agreements:", error)
    return NextResponse.json({ agreements: [] })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient()
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
