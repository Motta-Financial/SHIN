import { NextResponse } from "next/server"

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const CLIENTS_TABLE_ID = "tblL0X9VgE6lcYenY" // SEED | Clients | FALL 2025

export async function GET() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Airtable credentials not configured" }, { status: 500 })
  }

  try {
    let allRecords: any[] = []
    let offset: string | undefined = undefined

    do {
      const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${CLIENTS_TABLE_ID}`)
      if (offset) {
        url.searchParams.append("offset", offset)
      }

      const response = await fetch(url.toString(), {
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
      allRecords = allRecords.concat(data.records || [])
      offset = data.offset

      console.log("[v0] Clients API - Fetched batch:", data.records?.length || 0, "Total so far:", allRecords.length)
    } while (offset)

    console.log("[v0] Clients API - Total records fetched:", allRecords.length)

    if (allRecords.length > 0) {
      const sampleRecord = allRecords[0]
      console.log("[v0] Clients API - Sample record fields:", Object.keys(sampleRecord.fields))
      console.log("[v0] Clients API - Sample record data:", sampleRecord.fields)

      const withPrimaryClinic = allRecords.filter((r) => r.fields["Primary Clinic Director"]).length
      const withDirectorName = allRecords.filter((r) => r.fields["Director Name"] || r.fields["Director"]).length
      console.log("[v0] Clients API - Records with Primary Clinic Director:", withPrimaryClinic)
      console.log("[v0] Clients API - Records with Director Name field:", withDirectorName)

      // Log all unique field names to see what director fields exist
      const allFieldNames = new Set<string>()
      allRecords.forEach((record) => {
        Object.keys(record.fields).forEach((fieldName) => {
          if (fieldName.toLowerCase().includes("director")) {
            allFieldNames.add(fieldName)
          }
        })
      })
      console.log("[v0] Clients API - All director-related fields found:", Array.from(allFieldNames))
    }

    return NextResponse.json({ records: allRecords })
  } catch (error) {
    console.error("[v0] Airtable API error:", error)
    return NextResponse.json({ error: "Failed to fetch clients data from Airtable" }, { status: 500 })
  }
}
