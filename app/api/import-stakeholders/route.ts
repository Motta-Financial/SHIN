import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { directorsData, studentsData, clientsData } from "@/lib/seed-data/stakeholders"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Helper to generate UUID v4
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Helper to normalize clinic names
function normalizeClinicName(clinic: string): string {
  const clinicMap: Record<string, string> = {
    accounting: "Accounting Clinic",
    marketing: "Marketing Clinic",
    consulting: "Consulting Clinic",
    legal: "Legal Clinic",
    "resource acquisition": "Resource Acquisition Clinic",
    "artificial intelligence": "AI Clinic",
    management: "Management Clinic",
  }
  return clinicMap[clinic.toLowerCase()] || `${clinic} Clinic`
}

export async function GET() {
  return NextResponse.json({
    message: "Import Stakeholders API",
    endpoints: {
      POST: "Import all stakeholders (directors, students, clients) from seed data",
    },
    counts: {
      directors: directorsData.length,
      students: studentsData.length,
      clients: clientsData.length,
    },
  })
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get("mode") || "full"

    const results = {
      directors: { inserted: 0, updated: 0, errors: [] as string[] },
      students: { inserted: 0, updated: 0, errors: [] as string[] },
      clients: { inserted: 0, updated: 0, errors: [] as string[] },
      clinics: { inserted: 0, errors: [] as string[] },
      clinic_directors: { inserted: 0, errors: [] as string[] },
      clinic_students: { inserted: 0, errors: [] as string[] },
      client_assignments: { inserted: 0, errors: [] as string[] },
    }

    // Step 1: Ensure clinics exist
    const clinicNames = [
      "Accounting Clinic",
      "Marketing Clinic",
      "Consulting Clinic",
      "Legal Clinic",
      "Resource Acquisition Clinic",
      "AI Clinic",
      "Management Clinic",
    ]

    const clinicMap: Record<string, string> = {}

    for (const clinicName of clinicNames) {
      const { data: existingClinic } = await supabase.from("clinics").select("id").eq("name", clinicName).single()

      if (existingClinic) {
        clinicMap[clinicName] = existingClinic.id
      } else {
        const clinicId = generateUUID()
        const { error } = await supabase.from("clinics").insert({
          id: clinicId,
          name: clinicName,
          semester: "Spring 2025",
        })
        if (error) {
          results.clinics.errors.push(`Failed to create clinic ${clinicName}: ${error.message}`)
        } else {
          clinicMap[clinicName] = clinicId
          results.clinics.inserted++
        }
      }
    }

    // Step 2: Import Directors
    const directorMap: Record<string, string> = {}

    for (const director of directorsData) {
      const fullName = `${director.firstName} ${director.lastName}`
      const clinicName = normalizeClinicName(director.clinic)
      const clinicId = clinicMap[clinicName]

      const { data: existingDirector } = await supabase
        .from("directors")
        .select("id")
        .eq("email", director.email)
        .single()

      if (existingDirector) {
        directorMap[director.email] = existingDirector.id
        const { error } = await supabase
          .from("directors")
          .update({
            full_name: fullName,
            clinic: clinicName,
            role: director.role,
            clinic_id: clinicId,
          })
          .eq("id", existingDirector.id)

        if (error) {
          results.directors.errors.push(`Failed to update director ${fullName}: ${error.message}`)
        } else {
          results.directors.updated++
        }
      } else {
        const directorId = generateUUID()
        const { error } = await supabase.from("directors").insert({
          id: directorId,
          full_name: fullName,
          email: director.email,
          clinic: clinicName,
          role: director.role,
          clinic_id: clinicId,
          semester: "Spring 2025",
        })

        if (error) {
          results.directors.errors.push(`Failed to insert director ${fullName}: ${error.message}`)
        } else {
          directorMap[director.email] = directorId
          results.directors.inserted++
        }
      }

      // Create clinic_directors mapping
      if (clinicId && directorMap[director.email]) {
        const { data: existingMapping } = await supabase
          .from("clinic_directors")
          .select("id")
          .eq("director_id", directorMap[director.email])
          .eq("clinic_id", clinicId)
          .single()

        if (!existingMapping) {
          const { error } = await supabase.from("clinic_directors").insert({
            id: generateUUID(),
            director_id: directorMap[director.email],
            clinic_id: clinicId,
            role: director.role,
            semester: "Spring 2025",
          })
          if (error) {
            results.clinic_directors.errors.push(`Failed to create clinic_directors mapping: ${error.message}`)
          } else {
            results.clinic_directors.inserted++
          }
        }
      }
    }

    // Step 3: Import Clients
    const clientMap: Record<string, string> = {}

    for (const client of clientsData) {
      const { data: existingClient } = await supabase.from("clients").select("id").eq("name", client.name).single()

      if (existingClient) {
        clientMap[client.name] = existingClient.id
        const { error } = await supabase
          .from("clients")
          .update({
            status: client.status,
            semester: client.semester,
            project_type: client.projectType,
          })
          .eq("id", existingClient.id)

        if (error) {
          results.clients.errors.push(`Failed to update client ${client.name}: ${error.message}`)
        } else {
          results.clients.updated++
        }
      } else {
        const clientId = generateUUID()
        const { error } = await supabase.from("clients").insert({
          id: clientId,
          name: client.name,
          status: client.status,
          semester: client.semester,
          project_type: client.projectType,
        })

        if (error) {
          results.clients.errors.push(`Failed to insert client ${client.name}: ${error.message}`)
        } else {
          clientMap[client.name] = clientId
          results.clients.inserted++
        }
      }
    }

    // Step 4: Import Students
    const studentMap: Record<string, string> = {}

    for (const student of studentsData) {
      const fullName = `${student.firstName} ${student.lastName}`
      const clinicName = normalizeClinicName(student.clinic)
      const clinicId = clinicMap[clinicName]
      const clientId = clientMap[student.clientTeam]

      const { data: existingStudent } = await supabase.from("students").select("id").eq("email", student.email).single()

      if (existingStudent) {
        studentMap[student.email] = existingStudent.id
        const { error } = await supabase
          .from("students")
          .update({
            full_name: fullName,
            clinic: clinicName,
            client_id: clientId,
            is_team_leader: student.isTeamLeader,
            academic_level: student.academicLevel,
            university_id: student.universityId,
          })
          .eq("id", existingStudent.id)

        if (error) {
          results.students.errors.push(`Failed to update student ${fullName}: ${error.message}`)
        } else {
          results.students.updated++
        }
      } else {
        const studentId = generateUUID()
        const { error } = await supabase.from("students").insert({
          id: studentId,
          full_name: fullName,
          email: student.email,
          clinic: clinicName,
          client_id: clientId,
          is_team_leader: student.isTeamLeader,
          academic_level: student.academicLevel,
          university_id: student.universityId,
          semester: "Spring 2025",
        })

        if (error) {
          results.students.errors.push(`Failed to insert student ${fullName}: ${error.message}`)
        } else {
          studentMap[student.email] = studentId
          results.students.inserted++
        }
      }

      // Create clinic_students mapping
      if (clinicId && studentMap[student.email]) {
        const { data: existingMapping } = await supabase
          .from("clinic_students")
          .select("id")
          .eq("student_id", studentMap[student.email])
          .eq("clinic_id", clinicId)
          .single()

        if (!existingMapping) {
          const { error } = await supabase.from("clinic_students").insert({
            id: generateUUID(),
            student_id: studentMap[student.email],
            clinic_id: clinicId,
            semester: "Spring 2025",
          })
          if (error) {
            results.clinic_students.errors.push(`Failed to create clinic_students mapping: ${error.message}`)
          } else {
            results.clinic_students.inserted++
          }
        }
      }

      // Create client_assignments mapping
      if (clientId && studentMap[student.email]) {
        const { data: existingAssignment } = await supabase
          .from("client_assignments")
          .select("id")
          .eq("student_id", studentMap[student.email])
          .eq("client_id", clientId)
          .single()

        if (!existingAssignment) {
          const { error } = await supabase.from("client_assignments").insert({
            id: generateUUID(),
            student_id: studentMap[student.email],
            client_id: clientId,
            role: student.isTeamLeader ? "Team Leader" : "Team Member",
            semester: "Spring 2025",
          })
          if (error) {
            results.client_assignments.errors.push(`Failed to create client_assignments mapping: ${error.message}`)
          } else {
            results.client_assignments.inserted++
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Stakeholders import completed",
      results,
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
