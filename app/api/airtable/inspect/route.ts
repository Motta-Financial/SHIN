import { NextResponse } from "next/server"

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

export async function GET() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Airtable credentials not configured" }, { status: 500 })
  }

  try {
    // Get base schema to see all tables
    const schemaResponse = await fetch(`https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    })

    if (!schemaResponse.ok) {
      const errorBody = await schemaResponse.text()
      return NextResponse.json(
        { error: "Failed to fetch schema", details: errorBody },
        { status: schemaResponse.status },
      )
    }

    const schema = await schemaResponse.json()

    // Find tables that might contain debrief data
    const tables = schema.tables.map((table: any) => ({
      id: table.id,
      name: table.name,
      fields: table.fields.map((f: any) => f.name),
    }))

    // Try to fetch sample records from each table to see which has the debrief data
    const tableData = await Promise.all(
      tables.map(async (table: any) => {
        try {
          const recordsResponse = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table.id}?maxRecords=3`,
            {
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              },
            },
          )

          if (recordsResponse.ok) {
            const data = await recordsResponse.json()
            return {
              ...table,
              sampleRecord: data.records[0]?.fields || null,
              recordCount: data.records.length,
            }
          }
          return table
        } catch (error) {
          return table
        }
      }),
    )

    return NextResponse.json({ tables: tableData })
  } catch (error) {
    console.error("[v0] Airtable inspection error:", error)
    return NextResponse.json({ error: "Failed to inspect Airtable base" }, { status: 500 })
  }
}
