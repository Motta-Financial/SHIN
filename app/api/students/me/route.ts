import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// API to get current student's complete profile with all relationships
// Supports both UUID-based lookup (preferred) and email fallback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const authUserId = searchParams.get("authUserId")
    const email = searchParams.get("email") // Legacy fallback

    if (!studentId && !authUserId && !email) {
      return NextResponse.json({ success: false, error: "studentId, authUserId, or email required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Build query - prefer UUID-based lookups over email
    // Using students_current for current semester data
    let query = supabase
      .from("students_current")
      .select(`
        id,
        first_name,
        last_name,
        full_name,
        email,
        university_id,
        clinic,
        clinic_id,
        client_id,
        client_team,
        is_team_leader,
        academic_level,
        education,
        linkedin_profile,
        business_experience,
        semester,
        status,
        created_at,
        updated_at
      `)

    // Use UUID-based lookup if available (preferred)
    if (studentId) {
      query = query.eq("id", studentId)
    } else if (authUserId) {
      query = query.eq("user_id", authUserId)
    } else if (email) {
      // Legacy fallback - email lookup
      query = query.eq("email", email)
    }

    const { data: student, error: studentError } = await query.maybeSingle()

    if (studentError) {
      console.error("[v0] Error fetching student:", studentError)
      return NextResponse.json({ success: false, error: studentError.message }, { status: 500 })
    }

    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 })
    }

    // Get client assignments with client details
    const { data: clientAssignments } = await supabase
      .from("client_assignments")
      .select(`
        id,
        role,
        clinic,
        assigned_at,
        clients:client_id (
          id,
          name,
          email,
          contact_name,
          website,
          status,
          semester
        )
      `)
      .eq("student_id", student.id)

    // Get debriefs for this student (current semester)
    const { data: debriefs } = await supabase
      .from("debriefs_current")
      .select(`
        id,
        week_ending,
        week_number,
        hours_worked,
        work_summary,
        questions,
        client_name,
        clinic,
        status,
        date_submitted,
        reviewed_at,
        reviewed_by,
        semester
      `)
      .eq("student_id", student.id)
      .order("week_ending", { ascending: false })

    // Get attendance records (current semester)
    const { data: attendance } = await supabase
      .from("attendance_current")
      .select(`
        week_number,
        week_ending,
        class_date,
        clinic,
        notes
      `)
      .eq("student_id", student.id)
      .order("week_ending", { ascending: false })

    // Get documents uploaded by this student (current semester)
    const { data: documents } = await supabase
      .from("documents_current")
      .select(`
        id,
        file_name,
        file_url,
        file_type,
        submission_type,
        description,
        client_name,
        clinic,
        semester,
        uploaded_at
      `)
      .eq("student_name", student.full_name)
      .order("uploaded_at", { ascending: false })

    // Get document reviews for student's documents
    const documentIds = documents?.map((d) => d.id) || []
    const { data: reviews } = await supabase
      .from("document_reviews")
      .select(`
        id,
        document_id,
        grade,
        comment,
        director_name,
        created_at
      `)
      .in("document_id", documentIds.length > 0 ? documentIds : ["00000000-0000-0000-0000-000000000000"])

    // Get directors for student's clinic (current semester)
    const { data: directors } = await supabase
      .from("directors_current")
      .select(`
        id,
        full_name,
        email,
        role,
        job_title
      `)
      .eq("clinic", student.clinic)

    // Get meeting requests from this student
    const { data: meetingRequests } = await supabase
      .from("meeting_requests")
      .select(`
        id,
        subject,
        message,
        preferred_dates,
        status,
        created_at,
        updated_at
      `)
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })

    // Calculate totals
    const totalHours = debriefs?.reduce((sum, d) => sum + (d.hours_worked || 0), 0) || 0
    const uniqueClients = new Set(debriefs?.map((d) => d.client_name).filter(Boolean))
    const submissionCount = debriefs?.length || 0
    const attendanceCount = attendance?.length || 0
    const pendingQuestions = debriefs?.filter((d) => d.questions && d.questions.trim().length > 0) || []

    return NextResponse.json({
      success: true,
      data: {
        ...student,
        clients:
          clientAssignments?.map((ca: any) => ({
            ...ca.clients,
            role: ca.role,
            assignedAt: ca.assigned_at,
          })) || [],
        debriefs: debriefs || [],
        attendance: attendance || [],
        documents:
          documents?.map((doc) => ({
            ...doc,
            reviews: reviews?.filter((r) => r.document_id === doc.id) || [],
          })) || [],
        directors: directors || [],
        meetingRequests: meetingRequests || [],
        stats: {
          totalHours,
          clientCount: uniqueClients.size,
          submissionCount,
          attendanceCount,
          pendingQuestionsCount: pendingQuestions.length,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Error in student me API:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch student data" }, { status: 500 })
  }
}
