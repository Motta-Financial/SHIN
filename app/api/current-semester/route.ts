import { NextResponse } from "next/server"
import { getCurrentSemester } from "@/lib/semester"

export async function GET() {
  try {
    const semester = await getCurrentSemester()
    
    return NextResponse.json({
      success: true,
      semesterId: semester.id,
      semesterName: semester.name,
    })
  } catch (error) {
    console.error("[current-semester] Error:", error)
    
    // Return fallback values
    return NextResponse.json({
      success: true,
      semesterId: "a1b2c3d4-e5f6-7890-abcd-202601120000",
      semesterName: "Spring 2026",
    })
  }
}
