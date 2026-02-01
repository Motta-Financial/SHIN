import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { client, entries } = body

    if (!client || !entries || entries.length === 0) {
      return NextResponse.json({ summary: "No activity data available for this client." })
    }

    // Generate a simple summary from the entries without AI for now
    // This avoids rate limiting issues and provides immediate feedback
    const totalHours = entries.reduce((sum: number, e: { hours: number }) => sum + (e.hours || 0), 0)
    const workDescriptions = entries
      .map((e: { work: string }) => e.work)
      .filter((w: string) => w && w.trim())
      .slice(0, 3)

    let summary = `This week, the team logged ${totalHours.toFixed(1)} hours of work across ${entries.length} activities.`

    if (workDescriptions.length > 0) {
      summary += ` Key activities included: ${workDescriptions.join("; ")}.`
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error("Error generating client summary:", error)
    return NextResponse.json({ summary: "Unable to generate summary at this time." })
  }
}
