import { NextResponse } from "next/server"

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const SUBMISSIONS_TABLE = "SEED| Work Submissions"

export async function GET() {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${SUBMISSIONS_TABLE}?maxRecords=1000&sort[0][field]=Date Submitted&sort[0][direction]=desc`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      },
    )

    if (!response.ok) {
      console.log("[v0] Submissions table not found or not accessible, returning empty data")
      return NextResponse.json({ records: [] }, { status: 200 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching submissions:", error)
    return NextResponse.json({ records: [] }, { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentName, studentEmail, client, description, documentUrl, clinic } = body

    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${SUBMISSIONS_TABLE}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          "Student Name": studentName,
          "Student Email": studentEmail,
          Client: client,
          Description: description,
          "Document URL": documentUrl,
          "Related Clinic": clinic,
          "Date Submitted": new Date().toISOString(),
          Status: "Pending Review",
        },
      }),
    })

    if (!response.ok) {
      if (response.status === 404 || response.status === 403) {
        return NextResponse.json(
          {
            error: "Table 'SEED| Work Submissions' not found. Please create it in Airtable first.",
          },
          { status: 404 },
        )
      }
      const errorData = await response.json()
      throw new Error(errorData.error?.message || response.statusText)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error creating submission:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create submission",
      },
      { status: 500 },
    )
  }
}
