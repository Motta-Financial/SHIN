import { streamText, tool } from "ai"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

export const maxDuration = 60

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Tool definitions for SHIN to query the database
const getStudentsTool = tool({
  description: "Get information about students in the SEED program. Can filter by clinic, client, or get all students.",
  parameters: z.object({
    clinicId: z.string().optional().describe("Filter by clinic UUID"),
    clientId: z.string().optional().describe("Filter by client UUID"),
    limit: z.number().optional().default(20).describe("Max number of results"),
  }),
  execute: async ({ clinicId, clientId, limit }) => {
    let query = supabase
      .from("v_complete_mapping")
      .select("student_id, student_name, student_email, client_name, clinic_name, clinic_director_name")
      .limit(limit || 20)

    if (clinicId) query = query.eq("clinic_id", clinicId)
    if (clientId) query = query.eq("client_id", clientId)

    const { data, error } = await query
    if (error) return { error: error.message }
    return { students: data, count: data?.length || 0 }
  },
})

const getClientsTool = tool({
  description: "Get information about clients (companies/organizations) in the SEED program.",
  parameters: z.object({
    directorId: z.string().optional().describe("Filter by director UUID"),
    limit: z.number().optional().default(20).describe("Max number of results"),
  }),
  execute: async ({ directorId, limit }) => {
    let query = supabase
      .from("clients")
      .select("id, name, industry, status, company_background, primary_director:directors(full_name)")
      .limit(limit || 20)

    if (directorId) query = query.eq("primary_director_id", directorId)

    const { data, error } = await query
    if (error) return { error: error.message }
    return { clients: data, count: data?.length || 0 }
  },
})

const getDebriefsTool = tool({
  description: "Get debrief submissions from students. Can filter by student, client, or date range.",
  parameters: z.object({
    studentId: z.string().optional().describe("Filter by student UUID"),
    clientName: z.string().optional().describe("Filter by client name"),
    weekNumber: z.number().optional().describe("Filter by specific week number"),
    limit: z.number().optional().default(20).describe("Max number of results"),
  }),
  execute: async ({ studentId, clientName, weekNumber, limit }) => {
    let query = supabase
      .from("debriefs")
      .select(
        "id, student_name, client_name, week_number, hours_worked, work_summary, questions, date_submitted, status",
      )
      .order("date_submitted", { ascending: false })
      .limit(limit || 20)

    if (studentId) query = query.eq("student_id", studentId)
    if (clientName) query = query.ilike("client_name", `%${clientName}%`)
    if (weekNumber) query = query.eq("week_number", weekNumber)

    const { data, error } = await query
    if (error) return { error: error.message }

    const totalHours = data?.reduce((sum, d) => sum + (d.hours_worked || 0), 0) || 0
    return { debriefs: data, count: data?.length || 0, totalHours }
  },
})

const getSemesterScheduleTool = tool({
  description: "Get the semester schedule including class dates, topics, and deadlines.",
  parameters: z.object({
    semesterId: z.string().optional().describe("Filter by semester UUID"),
  }),
  execute: async ({ semesterId }) => {
    let query = supabase.from("semester_schedule").select("*").order("week_number", { ascending: true })

    if (semesterId) query = query.eq("semester_id", semesterId)

    const { data, error } = await query
    if (error) return { error: error.message }
    return { schedule: data, totalWeeks: data?.length || 0 }
  },
})

const getDirectorsTool = tool({
  description: "Get information about clinic directors.",
  parameters: z.object({
    clinicId: z.string().optional().describe("Filter by clinic UUID"),
  }),
  execute: async ({ clinicId }) => {
    let query = supabase.from("directors").select("id, full_name, email, clinic:clinics(name)")

    if (clinicId) query = query.eq("clinic_id", clinicId)

    const { data, error } = await query
    if (error) return { error: error.message }
    return { directors: data, count: data?.length || 0 }
  },
})

const getDocumentsTool = tool({
  description: "Get documents uploaded to the SEED program including SOW, presentations, and other materials.",
  parameters: z.object({
    clientId: z.string().optional().describe("Filter by client UUID"),
    documentType: z.string().optional().describe("Filter by document type (sow, midterm, final, etc.)"),
    limit: z.number().optional().default(20).describe("Max number of results"),
  }),
  execute: async ({ clientId, documentType, limit }) => {
    let query = supabase
      .from("documents")
      .select("id, file_name, file_type, document_type, uploaded_by, uploaded_at, client_name")
      .order("uploaded_at", { ascending: false })
      .limit(limit || 20)

    if (clientId) query = query.eq("client_id", clientId)
    if (documentType) query = query.eq("document_type", documentType)

    const { data, error } = await query
    if (error) return { error: error.message }
    return { documents: data, count: data?.length || 0 }
  },
})

const getProgramStatsTool = tool({
  description: "Get overall statistics about the SEED program including total students, clients, hours logged, etc.",
  parameters: z.object({}),
  execute: async () => {
    const [studentsRes, clientsRes, debriefsRes, documentsRes] = await Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("debriefs").select("hours_worked"),
      supabase.from("documents").select("id", { count: "exact", head: true }),
    ])

    const totalHours = debriefsRes.data?.reduce((sum, d) => sum + (d.hours_worked || 0), 0) || 0

    return {
      totalStudents: studentsRes.count || 0,
      totalClients: clientsRes.count || 0,
      totalDebriefs: debriefsRes.data?.length || 0,
      totalHoursLogged: totalHours,
      totalDocuments: documentsRes.count || 0,
    }
  },
})

const getGradingInfoTool = tool({
  description: "Get information about the SEED program grading structure and requirements.",
  parameters: z.object({}),
  execute: async () => {
    return {
      gradingBreakdown: {
        attendance: { weight: "15%", description: "Weekly attendance and debrief submissions" },
        statementOfWork: { weight: "20%", description: "SOW document with project scope and deliverables" },
        midtermPresentation: { weight: "30%", description: "Mid-semester client presentation" },
        finalPresentation: { weight: "35%", description: "Final project presentation and deliverables" },
      },
      majorDeliverables: [
        { name: "Statement of Work (SOW)", dueWeek: 4, weight: "20%" },
        { name: "Mid-Term Presentation", dueWeek: 8, weight: "30%" },
        { name: "Final Presentation", dueWeek: 15, weight: "35%" },
      ],
      weeklyRequirements: [
        "Submit weekly attendance with class password",
        "Complete weekly debrief form with hours and work summary",
        "Attend clinic team meetings",
      ],
    }
  },
})

const searchKnowledgeBaseTool = tool({
  description: "Search for information about SEED, Suffolk University, or program-specific questions.",
  parameters: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async ({ query }) => {
    const lowerQuery = query.toLowerCase()

    // Knowledge base about SEED program
    const knowledge: Record<string, string> = {
      seed: "SEED (Suffolk Experiential Education & Development) is a program at Suffolk University that connects students with real-world client projects. Students work in teams under clinic directors to deliver professional consulting services to actual businesses.",
      suffolk:
        "Suffolk University is a private university located in Boston, Massachusetts. The SEED program is part of Suffolk's experiential learning initiatives, providing students with hands-on business consulting experience.",
      clinic:
        "A clinic in SEED is a team of students led by a clinic director. Each clinic works with multiple clients throughout the semester, providing business consulting services.",
      director:
        "Clinic directors are faculty members or industry professionals who oversee student teams. They guide students through client engagements and evaluate their work.",
      client:
        "Clients are real businesses and organizations that partner with SEED to receive consulting services from student teams. Students help clients with various business challenges.",
      debrief:
        "Weekly debriefs are required submissions where students report their hours worked, summarize their activities, and ask any questions. This counts toward the 15% attendance grade.",
      sow: "Statement of Work (SOW) is a key deliverable worth 20% of the grade. It outlines the project scope, deliverables, timeline, and team responsibilities for the client engagement.",
      presentation:
        "Students deliver two major presentations: Mid-Term (30%) and Final (35%). These showcase progress and final deliverables to clients and faculty.",
    }

    const results: string[] = []
    for (const [key, value] of Object.entries(knowledge)) {
      if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
        results.push(value)
      }
    }

    return {
      results:
        results.length > 0
          ? results
          : [
              "I don't have specific information about that topic. Try asking about SEED, clinics, directors, clients, debriefs, SOW, or presentations.",
            ],
      matchedTopics: Object.keys(knowledge).filter((k) => lowerQuery.includes(k)),
    }
  },
})

export async function POST(req: Request) {
  const { messages, userType, userName, userEmail, clinicId, clientId, studentId } = await req.json()

  const systemPrompt = `You are SHIN (SEED Hub Intelligence Navigator), a helpful AI assistant for the SEED program at Suffolk University. You are female, friendly, professional, and knowledgeable about all aspects of the SEED program.

Your personality:
- Warm and supportive, like a knowledgeable teaching assistant
- Professional but approachable
- Enthusiastic about helping users succeed
- Clear and concise in explanations

Current user context:
- User Type: ${userType}
- User Name: ${userName}
- User Email: ${userEmail}
${clinicId ? `- Clinic ID: ${clinicId}` : ""}
${clientId ? `- Client ID: ${clientId}` : ""}
${studentId ? `- Student ID: ${studentId}` : ""}

You have access to tools to query the SEED database for:
- Student information and assignments
- Client details and engagements
- Debrief submissions and hours
- Semester schedule and deadlines
- Documents and deliverables
- Program statistics
- Grading information

When answering questions:
1. Use the appropriate tools to fetch real data
2. Present information clearly and helpfully
3. Offer relevant follow-up suggestions
4. Be proactive about providing useful context

For questions about grading, assignments, or program structure, use the getGradingInfo tool.
For general SEED/Suffolk questions, use the searchKnowledgeBase tool.
Always be helpful and guide users to the information they need.`

  const result = streamText({
    model: "anthropic/claude-sonnet-4-20250514",
    system: systemPrompt,
    messages,
    tools: {
      getStudents: getStudentsTool,
      getClients: getClientsTool,
      getDebriefs: getDebriefsTool,
      getSemesterSchedule: getSemesterScheduleTool,
      getDirectors: getDirectorsTool,
      getDocuments: getDocumentsTool,
      getProgramStats: getProgramStatsTool,
      getGradingInfo: getGradingInfoTool,
      searchKnowledgeBase: searchKnowledgeBaseTool,
    },
    maxSteps: 5,
  })

  return result.toUIMessageStreamResponse()
}
