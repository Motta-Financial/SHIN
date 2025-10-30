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
    console.log("[v0] Fetching debriefs from:", recordsUrl)

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
    console.log("[v0] Debriefs response - record count:", data.records?.length || 0)
    if (data.records && data.records.length > 0) {
      console.log("[v0] First debrief record fields:", Object.keys(data.records[0].fields))
      console.log("[v0] Sample record data:", JSON.stringify(data.records[0].fields, null, 2))
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Airtable API error:", error)
    return NextResponse.json({ error: "Failed to fetch debriefs data from Airtable" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Airtable credentials not configured" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { studentName, question, clinic } = body

    if (!studentName || !question || !clinic) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const recordsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${DEBRIEFS_TABLE_ID}`
    console.log("[v0] Creating question submission:", { studentName, clinic })

    const response = await fetch(recordsUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Questions: question,
          "Date Submitted": new Date().toISOString().split("T")[0],
          "Related Clinic": clinic,
          Client: "Question Submission",
        },
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("[v0] Airtable API error:", response.status, errorBody)
      return NextResponse.json({ error: "Failed to create question", details: errorBody }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] Successfully created question submission")
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error creating question:", error)
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 })
  }
}
