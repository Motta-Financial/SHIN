import { NextResponse } from "next/server"

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const DEBRIEFS_TABLE_ID = "tblFs1gM0RsrV63cc"

export async function GET() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Airtable credentials not configured" }, { status: 500 })
  }

  try {
    const recordsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${DEBRIEFS_TABLE_ID}?maxRecords=1000`

    const response = await fetch(recordsUrl, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("[v0] Airtable API error:", response.status, errorBody)
      return NextResponse.json({ error: "Failed to fetch debriefs", details: errorBody }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Airtable API error:", error)
    return NextResponse.json({ error: "Failed to fetch debriefs data from Airtable" }, { status: 500 })
  }
}
