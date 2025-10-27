import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.AIRTABLE_API_KEY
    const baseId = process.env.AIRTABLE_BASE_ID

    if (!apiKey || !baseId) {
      return NextResponse.json({ error: "Missing Airtable credentials" }, { status: 500 })
    }

    const url = `https://api.airtable.com/v0/${baseId}/PRESEED%7C%20Prospects?maxRecords=1000`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Airtable API error:", response.status, errorText)
      return NextResponse.json(
        { error: "Failed to fetch prospects data", details: errorText },
        { status: response.status },
      )
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching prospects:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
