import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    // Mock user data for development
    return NextResponse.json({
      email: "sarah.johnson@example.com",
      name: "Sarah Johnson",
      userId: "mock-user-123",
      clinic: "Bloom Botanicals",
    })
  } catch (error) {
    console.error("[v0] Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
