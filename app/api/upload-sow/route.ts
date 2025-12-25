import { put } from "@vercel/blob"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

function createServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// SOW documents data
const sowDocuments = [
  {
    clientName: "Sawyer Parks Enterprises",
    studentName: "Adam Calnan",
    fileName: "Statement of Work - Sawyer Parks.pdf",
    content: `Statement of Work (SOW)
Client: Sawyer Parks Enterprises
Consulting Partner: Adam Calnan's SEED Team
Date: 22 October 2025

1. Project Summary
Project Description
Sawyer Parks Enterprises, a generational family-owned real estate holding company, seeks to reposition the 5th floor of the Pledge Building at 209 Columbus Avenue into a high-performing, flexible office environment tailored to post-pandemic tenant expectations.

2. Expected Outcomes
1. Market Intelligence Report: Summarizes demand for small class-B office suites
2. Ideal tenant profile identifying size, lease term, and feature preferences
3. Prototype floor plan with 3 viable configuration options
4. Cost-benefit and ROI comparison between in-house leasing and shared workspace provider

SEED Team & Roles:
- Adam Calnan - Consulting Lead
- Courage Chakanza - Finance & Resource Expert
- Rayah Sibunga - Marketing Expert
- Sara Marmoucha - Accounting Expert`,
  },
  {
    clientName: "Intriguing Hair",
    studentName: "Shubhangi Srivastava",
    fileName: "Statement of Work - Intriguing Hair.pdf",
    content: `STATEMENT OF WORK
For Intriguing Hair

Project Summary
Intriguing Hair Boston is a Boston-based luxury wig and hair-extension retailer founded by Nikia Londy.

Project Specific Objectives:
- Develop actionable financial insights and a QuickBooks integration plan
- Conduct targeted customer research to uncover purchasing behaviors
- Evaluate brand communications and digital presence
- Create a financial projection and funding strategy

SEED Team & Roles:
- Shubhangi Srivastava - Consulting Team & Team Leader
- Keya Patel & Ishani Rana - Resource Acquisition
- Collin Merwin - Accounting
- Sophia Emile - Marketing`,
  },
  {
    clientName: "Serene Cycle Co.",
    studentName: "Annalise Fosnight",
    fileName: "Statement of Work - Serene Cycle.pdf",
    content: `STATEMENT OF WORK
Prepared for Serene Cycle Co.

Project Specific Objectives:
1. Legal & Compliance
2. Marketing & Brand Development
3. Finance & Accounting
4. Resource Acquisition

SEED Team & Roles:
- Annalise Fosnight - Team Leader & Consulting
- Ashley Gonzalez - Resource Acquisition
- Riley DiBiase - Accounting & Financial Systems
- Nicole Nessim - Marketing & Brand Strategy`,
  },
  {
    clientName: "Marabou Cafe",
    studentName: "Marian O'Brien",
    fileName: "Statement of Work - Marabou Cafe.pdf",
    content: `STATEMENT OF WORK
For Marabou Cafe

Project Summary
Marabou Cafe is a family-owned, full-service Haitian restaurant located in Mattapan, MA.

Project Specific Objectives:
1. Develop sustainable marketing strategy
2. Develop comprehensive financial strategy
3. Formalize partnership agreements and loan documentation
4. Optimize operations and growth capacity

SEED Team & Roles:
- Marian O'Brien - Team Leader
- Mahekdeep Kaur Abrol - Marketing
- Nyasha Absolomon Mukwata - Finance
- Aline Silva - Accounting
- Paige Moscow and Grace Fucci - Legal`,
  },
]

export async function POST() {
  try {
    console.log("[v0] Starting SOW document upload...")
    const supabase = createServiceClient()
    const results = []

    for (const doc of sowDocuments) {
      try {
        console.log(`[v0] Uploading SOW for ${doc.clientName}...`)

        // Create a blob from the text content
        const blob = new Blob([doc.content], { type: "text/plain" })

        // Upload to Vercel Blob
        const { url } = await put(doc.fileName, blob, {
          access: "public",
          addRandomSuffix: true,
        })

        console.log(`[v0] Uploaded to Blob: ${url}`)

        // Insert into Supabase using service role (bypasses RLS)
        const { data, error } = await supabase.from("documents").insert({
          client_name: doc.clientName,
          file_name: doc.fileName,
          file_url: url,
          file_type: "text/plain",
          submission_type: "Student Submit",
          student_name: doc.studentName,
          uploaded_at: new Date().toISOString(),
          clinic: "SEED",
          description: "Statement of Work document submitted by student team",
        })

        if (error) {
          console.error(`[v0] Error inserting document for ${doc.clientName}:`, error)
          results.push({ client: doc.clientName, success: false, error: error.message })
        } else {
          console.log(`[v0] Successfully added SOW for ${doc.clientName}`)
          results.push({ client: doc.clientName, success: true })
        }
      } catch (error) {
        console.error(`[v0] Error processing ${doc.clientName}:`, error)
        results.push({
          client: doc.clientName,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    console.log("[v0] SOW document upload complete!")
    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("[v0] Error in SOW upload:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
