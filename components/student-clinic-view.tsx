"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Building2,
  Clock,
  Mail,
  ChevronDown,
  Briefcase,
  TrendingUp,
  MessageSquare,
  UserCheck,
  Target,
  FileText,
  Award,
  Upload,
  CheckCircle2,
  FileCheck,
  Presentation,
  FileSpreadsheet,
} from "lucide-react"
import { DiscussionBoard } from "./discussion-board"

const GRADING_BREAKDOWN = {
  participation: {
    weight: 10,
    label: "Participation & Professionalism",
    type: "Individual",
    description: "Class participation, attendance, and professional conduct",
  },
  debriefs: {
    weight: 20,
    label: "Weekly Debriefs",
    type: "Individual",
    description: "Weekly debrief submissions and quality",
  },
  sow: { weight: 15, label: "Statement of Work", type: "Team", description: "Client engagement documentation" },
  midterm: { weight: 25, label: "Mid-Term Presentation", type: "Team", description: "Progress presentation to client" },
  final: { weight: 30, label: "Final Presentation", type: "Team", description: "Final deliverable presentation" },
}

const DELIVERABLE_INSTRUCTIONS = {
  sow: {
    title: "Statement of Work",
    weight: "15% of Grade (Team)",
    dueInfo: "Due: Week 4",
    description:
      "A comprehensive document outlining the project scope, deliverables, timeline, and client expectations.",
    icon: FileText,
    instructions: [
      "Define clear project objectives and scope",
      "Outline specific deliverables with deadlines",
      "Establish communication protocols with client",
      "Include team member roles and responsibilities",
      "Set expectations for client involvement",
    ],
    templateSections: [
      {
        title: "1. Project Summary",
        description: "Brief overview of the engagement",
        content: ["Client name and background", "Project objectives", "Expected outcomes"],
        example: "This engagement between [Client] and SEED aims to...",
      },
      {
        title: "2. Project Scope & Deliverables",
        description: "What will be delivered",
        content: ["List all deliverables", "Define acceptance criteria", "Note any exclusions"],
        workstreams: [
          {
            name: "Market Research",
            activities: "Competitive analysis, customer interviews",
            deliverables: "Market assessment report",
          },
        ],
      },
      {
        title: "3. Schedule",
        description: "Timeline and milestones",
        content: ["Key milestones", "Meeting schedule", "Final presentation date"],
      },
      {
        title: "4. Team Roles",
        description: "Team member responsibilities",
        content: ["Team leader duties", "Individual responsibilities", "Communication leads"],
        teamRoles: [{ role: "Team Leader", responsibilities: "Overall project coordination" }],
      },
    ],
  },
  midterm: {
    title: "Mid-Term Presentation",
    weight: "25% of Grade (Team)",
    dueInfo: "Due: Week 8",
    description: "A progress presentation showcasing work completed and plans for remaining engagement.",
    icon: Presentation,
    instructions: [
      "Present progress on deliverables",
      "Share key findings and insights",
      "Outline remaining work plan",
      "Gather client feedback",
      "15-20 minute presentation + Q&A",
    ],
  },
  final: {
    title: "Final Presentation",
    weight: "30% of Grade (Team)",
    dueInfo: "Due: Week 14",
    description: "Final presentation delivering all completed work and recommendations to the client.",
    icon: FileSpreadsheet,
    instructions: [
      "Present all final deliverables",
      "Provide actionable recommendations",
      "Include implementation roadmap",
      "Deliver professional presentation",
      "25-30 minute presentation + Q&A",
    ],
  },
}

interface StudentClinicViewProps {
  currentStudent: {
    id: string
    fullName: string
    email: string
    clinic: string
    clinicId: string
    clientId: string
    clientName: string
  }
  deliverableDocuments?: any[]
  teamGrades?: any[]
  onDeliverableUpload?: (type: string, file: File) => Promise<void>
  uploadingDeliverable?: string | null
  courseMaterials?: any[]
  onDocumentSubmit?: (data: { type: string; client: string; description: string; file: File }) => Promise<void>
  submittingDocument?: boolean
}

interface ClinicMember {
  id: string
  name: string
  email: string
  clientId: string
  clientName: string
  role: string
  isTeamLeader: boolean
  hours: number
  debriefs: number
}

export function StudentClinicView({
  currentStudent,
  deliverableDocuments = [],
  teamGrades = [],
  onDeliverableUpload,
  uploadingDeliverable,
  courseMaterials = [],
  onDocumentSubmit,
  submittingDocument = false,
}: StudentClinicViewProps) {
  const [clinicMembers, setClinicMembers] = useState<ClinicMember[]>([])
  const [myTeamMembers, setMyTeamMembers] = useState<ClinicMember[]>([])
  const [debriefs, setDebriefs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("myteam")

  const [expandedDeliverable, setExpandedDeliverable] = useState<string | null>(null)
  const [submissionType, setSubmissionType] = useState("debrief")
  const [documentClient, setDocumentClient] = useState(currentStudent.clientName || "")
  const [documentDescription, setDocumentDescription] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (currentStudent.clinicId && currentStudent.clientId) {
      fetchClinicData()
    }
  }, [currentStudent.clinicId, currentStudent.clientId, currentStudent.id])

  const fetchClinicData = async () => {
    setLoading(true)
    try {
      // Fetch members from the student's specific clinic (all team members in the clinic)
      const clinicMappingRes = await fetch(`/api/supabase/v-complete-mapping?clinicId=${currentStudent.clinicId}`)
      const clinicMappingData = await clinicMappingRes.json()

      // Fetch members from the student's specific client team only
      const teamMappingRes = await fetch(`/api/supabase/v-complete-mapping?clientId=${currentStudent.clientId}`)
      const teamMappingData = await teamMappingRes.json()

      // Fetch debriefs filtered by the student's client_id
      const debriefsRes = await fetch(`/api/supabase/debriefs?clientId=${currentStudent.clientId}`)
      const debriefsData = await debriefsRes.json()

      const allDebriefs = debriefsData.debriefs || []
      setDebriefs(allDebriefs)

      // Process all clinic members with their hours
      const processMembers = (mappings: any[]): ClinicMember[] => {
        return (mappings || []).map((m: any) => {
          const memberDebriefs = allDebriefs.filter(
            (d: any) => d.studentId === m.student_id || d.student_id === m.student_id,
          )
          const totalHours = memberDebriefs.reduce(
            (sum: number, d: any) => sum + (Number.parseFloat(d.hoursWorked || d.hours_worked) || 0),
            0,
          )
          return {
            id: m.student_id,
            name: m.student_name,
            email: m.student_email,
            clientId: m.client_id,
            clientName: m.client_name || "Unassigned",
            role: m.student_role || "Team Member",
            isTeamLeader: m.student_role === "Team Leader",
            hours: totalHours,
            debriefs: memberDebriefs.length,
          }
        })
      }

      // Remove duplicates by student_id
      const uniqueById = (members: ClinicMember[]) => {
        const seen = new Set<string>()
        return members.filter((m) => {
          if (seen.has(m.id)) return false
          seen.add(m.id)
          return true
        })
      }

      setClinicMembers(uniqueById(processMembers(clinicMappingData.mappings || clinicMappingData.records || [])))
      setMyTeamMembers(uniqueById(processMembers(teamMappingData.mappings || teamMappingData.records || [])))
    } catch (error) {
      console.error("Error fetching clinic data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Group clinic members by client for the "All Clinic" view
  const membersByClient = useMemo(() => {
    const grouped: Record<string, ClinicMember[]> = {}
    clinicMembers.forEach((member) => {
      if (!grouped[member.clientName]) {
        grouped[member.clientName] = []
      }
      grouped[member.clientName].push(member)
    })
    return grouped
  }, [clinicMembers])

  // Calculate stats for MY team only
  const myTeamStats = useMemo(() => {
    const totalHours = myTeamMembers.reduce((sum, m) => sum + m.hours, 0)
    const totalDebriefs = myTeamMembers.reduce((sum, m) => sum + m.debriefs, 0)
    return { totalHours, totalDebriefs, totalMembers: myTeamMembers.length }
  }, [myTeamMembers])

  // Calculate stats for the full clinic
  const clinicStats = useMemo(() => {
    const totalHours = clinicMembers.reduce((sum, m) => sum + m.hours, 0)
    const totalDebriefs = clinicMembers.reduce((sum, m) => sum + m.debriefs, 0)
    const uniqueClients = Object.keys(membersByClient).length
    return { totalHours, totalDebriefs, uniqueClients, totalMembers: clinicMembers.length }
  }, [clinicMembers, membersByClient])

  const getDeliverableStatus = (type: string) => {
    const teamGrade = teamGrades.find((g) => g.deliverableType === type)
    if (teamGrade) {
      return {
        status: "graded",
        label: `Graded: ${teamGrade.grade}%`,
        color: "bg-green-100 text-green-700",
        grade: teamGrade.grade,
        feedback: teamGrade.feedback,
      }
    }
    const docs = deliverableDocuments.filter((d) => d.submissionType === type)
    if (docs.length === 0) return { status: "pending", label: "Not Submitted", color: "bg-slate-100 text-slate-600" }
    const latestDoc = docs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0]
    if (latestDoc.status === "graded")
      return {
        status: "graded",
        label: `Graded: ${latestDoc.grade}%`,
        color: "bg-green-100 text-green-700",
        grade: latestDoc.grade,
        feedback: latestDoc.feedback,
      }
    return { status: "submitted", label: "Submitted", color: "bg-blue-100 text-blue-700" }
  }

  const handleDocumentSubmit = async () => {
    if (!selectedFile || !onDocumentSubmit) return
    await onDocumentSubmit({
      type: submissionType,
      client: documentClient,
      description: documentDescription,
      file: selectedFile,
    })
    setSelectedFile(null)
    setDocumentDescription("")
  }

  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Clinic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-lg" />
              ))}
            </div>
            <div className="h-32 bg-slate-100 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* My Client Team Stats - Primary Focus */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            My Client Team: {currentStudent.clientName}
          </CardTitle>
          <CardDescription>Your assigned client team statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-white border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-600">Team Members</p>
                  <p className="text-xl font-bold text-blue-900">{myTeamStats.totalMembers}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-600">Team Hours</p>
                  <p className="text-xl font-bold text-blue-900">{myTeamStats.totalHours.toFixed(1)}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-600">Team Debriefs</p>
                  <p className="text-xl font-bold text-blue-900">{myTeamStats.totalDebriefs}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="myteam" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            My Team
          </TabsTrigger>
          <TabsTrigger value="clinic" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Full Clinic
          </TabsTrigger>
          <TabsTrigger value="deliverables" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Deliverables
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="team-discussion" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Team Chat
          </TabsTrigger>
          <TabsTrigger value="clinic-discussion" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Clinic Chat
          </TabsTrigger>
        </TabsList>

        {/* My Client Team Tab */}
        <TabsContent value="myteam" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{currentStudent.clientName} Team</CardTitle>
              <CardDescription>Your client team members and their activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {myTeamMembers.map((member) => (
                  <Collapsible key={member.id}>
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">{member.name}</p>
                            {member.isTeamLeader && (
                              <Badge className="bg-amber-100 text-amber-700 text-xs">Team Leader</Badge>
                            )}
                            {member.id === currentStudent.id && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">You</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">{member.hours.toFixed(1)} hrs</p>
                          <p className="text-xs text-slate-500">{member.debriefs} debriefs</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="h-4 w-4" />
                            <a href={`mailto:${member.email}`} className="text-blue-600 hover:underline">
                              {member.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Briefcase className="h-4 w-4" />
                            <span>{member.clientName}</span>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
                {myTeamMembers.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>No team members found for your client assignment.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Full Clinic Tab */}
        <TabsContent value="clinic" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{currentStudent.clinic} - All Teams</CardTitle>
                  <CardDescription>All students in your clinic organized by client team</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{clinicStats.totalMembers} students</Badge>
                  <Badge variant="outline">{clinicStats.uniqueClients} teams</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(membersByClient).map(([clientName, members]) => (
                <div key={clientName} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div
                    className={`p-3 border-b border-slate-200 ${clientName === currentStudent.clientName ? "bg-blue-50" : "bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-600" />
                      <h3 className="font-medium text-slate-900">{clientName}</h3>
                      {clientName === currentStudent.clientName && (
                        <Badge className="bg-blue-100 text-blue-700 text-xs">Your Team</Badge>
                      )}
                      <Badge variant="outline" className="ml-auto">
                        {members.length} members
                      </Badge>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {members.map((member) => (
                      <div key={member.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-slate-100 text-slate-700 text-sm">
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-900">{member.name}</p>
                              {member.isTeamLeader && (
                                <Badge className="bg-amber-100 text-amber-700 text-xs py-0">Lead</Badge>
                              )}
                              {member.id === currentStudent.id && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs py-0">You</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium text-slate-700">{member.hours.toFixed(1)} hrs</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(membersByClient).length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No clinic data available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deliverables Tab */}
        <TabsContent value="deliverables" className="mt-4 space-y-6">
          {/* Grading Reference Card */}
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Award className="h-5 w-5" />
                Grading Breakdown
              </CardTitle>
              <CardDescription>Total Potential Grade - 100%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(GRADING_BREAKDOWN).map(([key, item]) => (
                  <div key={key} className="p-3 bg-white rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant="outline"
                        className={
                          item.type === "Individual"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-green-50 text-green-700 border-green-200"
                        }
                      >
                        {item.type}
                      </Badge>
                      <span className="text-lg font-bold text-blue-700">{item.weight}%</span>
                    </div>
                    <p className="text-xs font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Deliverables Progress Overview */}
          <div className="grid grid-cols-3 gap-4">
            {(["sow", "midterm", "final"] as const).map((type) => {
              const info = DELIVERABLE_INSTRUCTIONS[type]
              const status = getDeliverableStatus(type)
              const Icon = info.icon
              return (
                <Card
                  key={type}
                  className={`cursor-pointer transition-all hover:shadow-md ${expandedDeliverable === type ? "ring-2 ring-blue-500" : ""}`}
                  onClick={() => setExpandedDeliverable(expandedDeliverable === type ? null : type)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${status.status === "graded" ? "bg-green-100" : status.status === "submitted" ? "bg-blue-100" : "bg-slate-100"}`}
                        >
                          <Icon
                            className={`h-5 w-5 ${status.status === "graded" ? "text-green-600" : status.status === "submitted" ? "text-blue-600" : "text-slate-500"}`}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{info.title}</h3>
                          <p className="text-xs text-slate-500">{info.weight}</p>
                        </div>
                      </div>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">{info.dueInfo}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Expanded Deliverable Details */}
          {expandedDeliverable && (
            <Card className="border-blue-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const info =
                        DELIVERABLE_INSTRUCTIONS[expandedDeliverable as keyof typeof DELIVERABLE_INSTRUCTIONS]
                      const Icon = info.icon
                      return (
                        <>
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Icon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle>{info.title}</CardTitle>
                            <CardDescription>
                              {info.weight} - {info.dueInfo}
                            </CardDescription>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  <Badge className={getDeliverableStatus(expandedDeliverable).color}>
                    {getDeliverableStatus(expandedDeliverable).label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-sm mb-2">Description</h4>
                  <p className="text-sm text-slate-600">
                    {DELIVERABLE_INSTRUCTIONS[expandedDeliverable as keyof typeof DELIVERABLE_INSTRUCTIONS].description}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">Requirements & Instructions</h4>
                  <ul className="space-y-2">
                    {DELIVERABLE_INSTRUCTIONS[
                      expandedDeliverable as keyof typeof DELIVERABLE_INSTRUCTIONS
                    ].instructions.map((instruction, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {instruction}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* SOW Template Sections */}
                {expandedDeliverable === "sow" && DELIVERABLE_INSTRUCTIONS.sow.templateSections && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5" />
                        SOW Template Guide
                      </h4>
                      <p className="text-sm text-blue-800">
                        Use the sections below as a template for your Statement of Work.
                      </p>
                    </div>
                    {DELIVERABLE_INSTRUCTIONS.sow.templateSections.map((section, sectionIdx) => (
                      <Accordion key={sectionIdx} type="single" collapsible className="w-full">
                        <AccordionItem value={`section-${sectionIdx}`} className="border rounded-lg">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <span className="flex items-center gap-2 text-sm font-medium">
                              <FileCheck className="h-4 w-4 text-emerald-600" />
                              {section.title}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 space-y-4">
                            <p className="text-sm text-slate-600 italic">{section.description}</p>
                            {section.content && (
                              <ul className="space-y-2">
                                {section.content.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                    <span className="text-emerald-600 font-bold">•</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {section.example && (
                              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mt-3">
                                <p className="text-xs font-medium text-slate-500 mb-1">Example:</p>
                                <p className="text-sm text-slate-600 italic">{section.example}</p>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ))}
                  </div>
                )}

                {/* Upload Section */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-3">Upload Submission</h4>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file && onDeliverableUpload) {
                          onDeliverableUpload(expandedDeliverable, file)
                        }
                      }}
                      className="flex-1"
                    />
                    {uploadingDeliverable === expandedDeliverable && (
                      <Badge variant="outline" className="animate-pulse">
                        Uploading...
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4 space-y-6">
          {/* Document Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
              <CardDescription>Submit presentations, reports, and other materials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Submission Type</Label>
                <Select value={submissionType} onValueChange={setSubmissionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debrief">Weekly Debrief</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="sow">Statement of Work</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Client</Label>
                <Input
                  value={documentClient}
                  onChange={(e) => setDocumentClient(e.target.value)}
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={documentDescription}
                  onChange={(e) => setDocumentDescription(e.target.value)}
                  placeholder="Describe this document..."
                  rows={3}
                />
              </div>
              <div>
                <Label>File</Label>
                <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </div>
              <Button onClick={handleDocumentSubmit} disabled={submittingDocument || !selectedFile}>
                <Upload className="h-4 w-4 mr-2" />
                {submittingDocument ? "Uploading..." : "Upload Document"}
              </Button>
            </CardContent>
          </Card>

          {/* Course Materials Section */}
          <Card>
            <CardHeader>
              <CardTitle>Course Materials</CardTitle>
              <CardDescription>Materials shared by your instructors and directors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courseMaterials.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">No course materials yet</p>
                ) : (
                  courseMaterials.map((material) => (
                    <div key={material.id} className="p-4 bg-white border border-slate-200 rounded-lg">
                      <p className="font-medium text-sm">{material.title}</p>
                      <p className="text-xs text-slate-500">
                        Uploaded: {new Date(material.uploadedDate).toLocaleDateString()}
                      </p>
                      {material.fileUrl && (
                        <a
                          href={material.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Discussion Tab - Filtered to client team only */}
        <TabsContent value="team-discussion" className="mt-4">
          <DiscussionBoard
            contextType="client"
            contextId={currentStudent.clientId}
            currentUser={{
              name: currentStudent.fullName,
              email: currentStudent.email,
              type: "student",
            }}
            title={`${currentStudent.clientName} Team Discussion`}
            description="Collaborate with your client team members"
          />
        </TabsContent>

        {/* Clinic Discussion Tab - Full clinic */}
        <TabsContent value="clinic-discussion" className="mt-4">
          <DiscussionBoard
            contextType="clinic"
            contextId={currentStudent.clinicId}
            currentUser={{
              name: currentStudent.fullName,
              email: currentStudent.email,
              type: "student",
            }}
            title={`${currentStudent.clinic} Discussion`}
            description="Discuss with all students in your clinic"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
