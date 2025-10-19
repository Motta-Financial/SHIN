import { NextResponse } from "next/server"

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const CLIENTS_TABLE_ID = "tblL0X9VgE6lcYenY" // SEED | Clients | FALL 2025

export async function GET() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Airtable credentials not configured" }, { status: 500 })
  }

  try {
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${CLIENTS_TABLE_ID}`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("[v0] Airtable API error:", response.status, errorBody)
      return NextResponse.json(
        {
          error: "Failed to fetch clients from Airtable",
          details: `Status ${response.status}: ${errorBody}`,
          hint: "Make sure your Airtable token has 'data.records:read' and 'schema.bases:read' scopes",
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Airtable API error:", error)
    return NextResponse.json({ error: "Failed to fetch clients data from Airtable" }, { status: 500 })
  }
}
