import { NextResponse } from "next/server"

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

export async function GET() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Airtable credentials not configured" }, { status: 500 })
  }

  try {
    // Use Airtable Meta API to get base schema
    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("[v0] Airtable Meta API error:", response.status, errorBody)
      throw new Error(`Failed to fetch tables: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching tables:", error)
    return NextResponse.json({ error: "Failed to fetch tables from Airtable" }, { status: 500 })
  }
}
