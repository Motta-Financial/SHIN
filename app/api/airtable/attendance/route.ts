import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const apiKey = process.env.AIRTABLE_API_KEY
    const baseId = process.env.AIRTABLE_BASE_ID

    if (!apiKey || !baseId) {
      return NextResponse.json({ error: "Missing Airtable credentials" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const recordIds = searchParams.get("recordIds")

    if (!recordIds) {
      return NextResponse.json({ error: "Missing recordIds parameter" }, { status: 400 })
    }

    // Parse the comma-separated record IDs
    const ids = recordIds.split(",")

    // Fetch attendance records using filterByFormula
    const formula = `OR(${ids.map((id) => `RECORD_ID()='${id}'`).join(",")})`
    const encodedFormula = encodeURIComponent(formula)

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/SEED%7C%20Attendance?filterByFormula=${encodedFormula}&maxRecords=1000`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Attendance fetch failed:", response.status, errorText)
      return NextResponse.json(
        { error: "Failed to fetch attendance data", details: errorText },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Attendance response - record count:", data.records?.length || 0)

    if (data.records && data.records.length > 0) {
      console.log("[v0] First attendance record fields:", Object.keys(data.records[0].fields))
      console.log("[v0] Sample attendance record:", data.records[0].fields)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching attendance:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
