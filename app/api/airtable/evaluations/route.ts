import { NextResponse } from "next/server"

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const EVALUATIONS_TABLE_ID = "tblqQxJvXqJvXqJvX" // Replace with actual table ID from Airtable

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get("client")
    const documentId = searchParams.get("documentId")

    console.log("[v0] Fetching Airtable evaluations for:", { clientName, documentId })

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return NextResponse.json({ error: "Airtable credentials not configured" }, { status: 500 })
    }

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblqQxJvXqJvXqJvX?maxRecords=1000`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[v0] Airtable evaluations response - record count:", data.records?.length || 0)

    if (data.records && data.records.length > 0) {
      console.log("[v0] First evaluation record fields:", Object.keys(data.records[0].fields))
      console.log("[v0] Sample evaluation record:", data.records[0].fields)
    }

    const evaluations = data.records
      .map((record: any) => {
        const fields = record.fields

        // Map Airtable fields to our format
        return {
          id: record.id,
          document_id: documentId || fields["Document ID"] || "",
          client_name: fields["Client Name"] || fields["Client"] || "",
          student_name: fields["Student Name"] || fields["Student"] || "",
          director_name: fields["Director Name"] || fields["Evaluator"] || fields["Clinic Director"] || "",
          clinic: fields["Clinic"] || fields["Related Clinic"] || "",
          question_1_rating: Number(fields["Question 1 Rating"] || fields["Q1 Rating"] || 0),
          question_2_rating: Number(fields["Question 2 Rating"] || fields["Q2 Rating"] || 0),
          question_3_rating: Number(fields["Question 3 Rating"] || fields["Q3 Rating"] || 0),
          question_4_rating: Number(fields["Question 4 Rating"] || fields["Q4 Rating"] || 0),
          question_5_rating: Number(fields["Question 5 Rating"] || fields["Q5 Rating"] || 0),
          additional_comments: fields["Additional Comments"] || fields["Comments"] || "",
          created_at: fields["Created At"] || fields["Date Submitted"] || new Date().toISOString(),
          updated_at: fields["Updated At"] || fields["Date Submitted"] || new Date().toISOString(),
        }
      })
      .filter((evaluation: any) => {
        // Filter by client name if provided
        if (clientName && evaluation.client_name !== clientName) {
          return false
        }
        // Filter by document ID if provided
        if (documentId && evaluation.document_id !== documentId) {
          return false
        }
        return true
      })

    console.log("[v0] Transformed evaluations count:", evaluations.length)

    return NextResponse.json({ evaluations })
  } catch (error) {
    console.error("[v0] Error fetching Airtable evaluations:", error)
    return NextResponse.json({ error: "Failed to fetch evaluations", evaluations: [] }, { status: 500 })
  }
}
