"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import {
  Building2,
  Users,
  Clock,
  AlertCircle,
  FileText,
  User,
  Upload,
  ExternalLink,
  Calendar,
  ClipboardList,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { getClinicColor } from "@/lib/clinic-colors"
import { Button } from "@/components/ui/button"
import { PresentationUpload } from "./presentation-upload"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EvaluationForm } from "./evaluation-form"
import { EvaluationDisplay } from "./evaluation-display"
import { SimpleComments } from "./simple-comments"

interface TeamMember {
  name: string
  role: string
}

interface Client {
  id: string
  name: string
  clinic: string
  director: string
  students: number
  hoursLogged: number
  hoursTarget: number
  status: "on-track" | "at-risk" | "ahead"
  lastUpdate: string
  recentWork: string[]
  teamMembers: TeamMember[]
}

interface Document {
  id: string
  student_name: string
  client_name: string
  file_url: string
  file_name: string
  description: string
  clinic: string
  uploaded_at: string
  submission_type?: string // Add submission_type field
}

interface Review {
  id: string
  document_id: string
  director_name: string
  comment: string
  grade: string
  created_at: string
}

interface Evaluation {
  id: string
  document_id: string
  director_name: string
  question_1_rating: number
  question_2_rating: number
  question_3_rating: number
  question_4_rating: number
  question_5_rating: number
  additional_comments: string
  created_at: string
  updated_at: string
  source?: string // Add source field
}

interface ClientEngagementsProps {
  selectedWeek: string
  selectedClinic: string
}

const CLINIC_DIRECTORS = [
  { name: "Nick Vadala", clinic: "Consulting" },
  { name: "Mark Dwyer", clinic: "Accounting" },
  { name: "Ken Mooney", clinic: "Funding" },
  { name: "Chris Hill", clinic: "Marketing" },
]

export function ClientEngagements({ selectedWeek, selectedClinic }: ClientEngagementsProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState<string | null>(null)
  const [documents, setDocuments] = useState<Record<string, Document[]>>({})
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation[]>>({})
  const [reviews, setReviews] = useState<Record<string, Review[]>>({})
  const [showEvalForm, setShowEvalForm] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [comment, setComment] = useState("")
  const [grade, setGrade] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [showMyClientsOnly, setShowMyClientsOnly] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const [clientsRes, debriefsRes] = await Promise.all([
          fetch("/api/airtable/clients"),
          fetch("/api/airtable/debriefs"),
        ])

        if (!clientsRes.ok || !debriefsRes.ok) {
          throw new Error("Failed to fetch data from Airtable")
        }

        const clientsData = await clientsRes.json()
        const debriefsData = await debriefsRes.json()

        const clientMap = new Map<string, Client>()

        if (clientsData.records) {
          clientsData.records.forEach((record: any) => {
            const fields = record.fields
            const clientName = fields["Client Name"] || "Unknown Client"
            const primaryClinic = fields["Primary Clinic Director"] || ""

            const directorName =
              fields["Director Name"] ||
              fields["Director"] ||
              fields["Primary Director"] ||
              fields["Director in Charge"] ||
              "Director TBD"

            const matchesClinic = selectedClinic === "all" || primaryClinic === selectedClinic

            const teamMembers: TeamMember[] = []

            if (fields["Consulting (Team Leader)"]) {
              const leaders = fields["Consulting (Team Leader)"].split(",").map((n: string) => n.trim())
              leaders.forEach((name: string) => {
                if (name) teamMembers.push({ name, role: "Lead" })
              })
            }

            if (fields["Accounting"]) {
              const accountants = fields["Accounting"].split(",").map((n: string) => n.trim())
              accountants.forEach((name: string) => {
                if (name) teamMembers.push({ name, role: "Accounting" })
              })
            }

            if (fields["Resource Acquisition"]) {
              const resourceTeam = fields["Resource Acquisition"].split(",").map((n: string) => n.trim())
              resourceTeam.forEach((name: string) => {
                if (name) teamMembers.push({ name, role: "Resource Acquisition" })
              })
            }

            if (fields["Marketing"]) {
              const marketers = fields["Marketing"].split(",").map((n: string) => n.trim())
              marketers.forEach((name: string) => {
                if (name) teamMembers.push({ name, role: "Marketing" })
              })
            }

            clientMap.set(record.id, {
              id: record.id,
              name: clientName,
              clinic: primaryClinic,
              director: directorName,
              students: 0,
              hoursLogged: 0,
              hoursTarget: 60,
              status: "on-track",
              lastUpdate: "No updates yet",
              recentWork: [],
              teamMembers,
            })
          })
        }

        if (debriefsData.records) {
          const studentsByClient = new Map<string, Set<string>>()
          const hoursByClient = new Map<string, number>()
          const latestUpdateByClient = new Map<string, Date>()
          const recentWorkByClient = new Map<string, string[]>()

          debriefsData.records.forEach((record: any) => {
            const fields = record.fields
            const weekEnding = fields["END DATE (from WEEK (from SEED | Schedule))"]
            const dateSubmitted = fields["Date Submitted"]

            let recordWeek = ""
            if (weekEnding) {
              recordWeek = Array.isArray(weekEnding) ? weekEnding[0] : weekEnding
            } else if (dateSubmitted) {
              const date = new Date(dateSubmitted)
              const day = date.getDay()
              const diff = 6 - day
              const weekEndingDate = new Date(date)
              weekEndingDate.setDate(date.getDate() + diff)
              recordWeek = weekEndingDate.toISOString().split("T")[0]
            }

            const relatedClinic = fields["Related Clinic"]
            const matchesClinic = selectedClinic === "all" || relatedClinic === selectedClinic

            if (recordWeek === selectedWeek && matchesClinic) {
              const clientLinks = fields["Client"]
              const studentName = fields["Student Name"]
              const hours = Number.parseFloat(fields["Number of Hours Worked"] || "0")
              const workDescription = fields["Summary of Work"]

              if (clientLinks && Array.isArray(clientLinks) && clientLinks.length > 0) {
                clientLinks.forEach((clientId: string) => {
                  if (clientMap.has(clientId)) {
                    if (!studentsByClient.has(clientId)) {
                      studentsByClient.set(clientId, new Set())
                    }
                    if (studentName) {
                      studentsByClient.get(clientId)!.add(studentName)
                    }

                    if (!hoursByClient.has(clientId)) {
                      hoursByClient.set(clientId, 0)
                    }
                    hoursByClient.set(clientId, hoursByClient.get(clientId)! + hours)

                    if (weekEnding) {
                      const dateStr = Array.isArray(weekEnding) ? weekEnding[0] : weekEnding
                      const date = new Date(dateStr)
                      if (!latestUpdateByClient.has(clientId) || date > latestUpdateByClient.get(clientId)!) {
                        latestUpdateByClient.set(clientId, date)
                      }
                    }

                    if (workDescription && workDescription.trim()) {
                      if (!recentWorkByClient.has(clientId)) {
                        recentWorkByClient.set(clientId, [])
                      }
                      const workList = recentWorkByClient.get(clientId)!
                      if (workList.length < 3 && !workList.includes(workDescription)) {
                        workList.push(workDescription)
                      }
                    }
                  }
                })
              }
            }
          })

          clientMap.forEach((client, clientId) => {
            if (studentsByClient.has(clientId)) {
              client.students = studentsByClient.get(clientId)!.size
            }

            if (hoursByClient.has(clientId)) {
              client.hoursLogged = hoursByClient.get(clientId)!
            }

            if (latestUpdateByClient.has(clientId)) {
              client.lastUpdate = "This week"
            }

            if (recentWorkByClient.has(clientId)) {
              client.recentWork = recentWorkByClient.get(clientId)!
            }

            const progress = (client.hoursLogged / client.hoursTarget) * 100
            if (progress >= 100) {
              client.status = "ahead"
            } else if (progress >= 60) {
              client.status = "on-track"
            } else {
              client.status = "at-risk"
            }
          })
        }

        const clientsArray = Array.from(clientMap.values())
        setClients(clientsArray)

        await fetchAllDocuments(clientsArray)
      } catch (err) {
        console.error("[v0] Error fetching Airtable data:", err)
        setError("Failed to load client data. Please check your Airtable connection.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedWeek, selectedClinic])

  const fetchAllDocuments = async (clientsList: Client[]) => {
    try {
      const docsData: Record<string, Document[]> = {}
      const evalsData: Record<string, Evaluation[]> = {}
      const reviewsData: Record<string, Review[]> = {}

      await Promise.all(
        clientsList.map(async (client) => {
          try {
            const response = await fetch(`/api/documents?client=${encodeURIComponent(client.name)}`)
            const data = await response.json()

            if (data.documents && data.documents.length > 0) {
              docsData[client.name] = data.documents

              await Promise.all(
                data.documents.map(async (doc: Document) => {
                  const isMidtermPPT =
                    doc.submission_type?.toLowerCase().includes("midterm") ||
                    doc.submission_type?.toLowerCase().includes("ppt") ||
                    doc.submission_type?.toLowerCase().includes("presentation") ||
                    doc.file_name.toLowerCase().includes("midterm")

                  if (isMidtermPPT) {
                    const [supabaseEvalRes, airtableEvalRes] = await Promise.all([
                      fetch(`/api/evaluations?documentId=${doc.id}`),
                      fetch(`/api/airtable/evaluations?client=${encodeURIComponent(client.name)}&documentId=${doc.id}`),
                    ])

                    const supabaseEvalData = await supabaseEvalRes.json()
                    const airtableEvalData = await airtableEvalRes.json()

                    const supabaseEvals = supabaseEvalData.evaluations || []
                    const airtableEvals = airtableEvalData.evaluations || []

                    // Create a map of director names to evaluations from Supabase
                    const evalsByDirector = new Map(supabaseEvals.map((e: Evaluation) => [e.director_name, e]))

                    // Add Airtable evaluations for directors who haven't evaluated in Supabase
                    airtableEvals.forEach((airtableEval: Evaluation) => {
                      if (!evalsByDirector.has(airtableEval.director_name)) {
                        evalsByDirector.set(airtableEval.director_name, {
                          ...airtableEval,
                          source: "airtable", // Mark as from Airtable
                        })
                      }
                    })

                    evalsData[doc.id] = Array.from(evalsByDirector.values())

                    console.log(`[v0] Merged evaluations for ${doc.file_name}:`, {
                      supabase: supabaseEvals.length,
                      airtable: airtableEvals.length,
                      total: evalsData[doc.id].length,
                    })
                  } else {
                    // Fetch simple reviews for SOW documents
                    const reviewRes = await fetch(`/api/documents/reviews?documentId=${doc.id}`)
                    const reviewData = await reviewRes.json()
                    reviewsData[doc.id] = reviewData.reviews || []
                  }
                }),
              )
            }
          } catch (error) {
            console.error(`[v0] Error fetching documents for ${client.name}:`, error)
          }
        }),
      )

      setDocuments(docsData)
      setEvaluations(evalsData)
      setReviews(reviewsData)
    } catch (error) {
      console.error("[v0] Error fetching documents:", error)
    }
  }

  const handleSubmitReview = async (documentId: string) => {
    if (!comment.trim() && !grade.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/documents/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          directorName: selectedClinic === "all" ? "Director" : selectedClinic,
          comment: comment.trim(),
          grade: grade.trim(),
        }),
      })

      if (response.ok) {
        setComment("")
        setGrade("")
        setSelectedDoc(null)
        await fetchAllDocuments(clients)
      }
    } catch (error) {
      console.error("[v0] Error submitting review:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const getGradeColor = (grade: string) => {
    const gradeUpper = grade.toUpperCase()
    if (gradeUpper.includes("A")) return "bg-green-100 text-green-800 border-green-300"
    if (gradeUpper.includes("B")) return "bg-blue-100 text-blue-800 border-blue-300"
    if (gradeUpper.includes("C")) return "bg-yellow-100 text-yellow-800 border-yellow-300"
    return "bg-slate-100 text-slate-800 border-slate-300"
  }

  const getStatusColor = (status: Client["status"]) => {
    switch (status) {
      case "ahead":
        return "bg-[#0077B6] text-white"
      case "on-track":
        return "bg-[#0096C7] text-white"
      case "at-risk":
        return "bg-red-500 text-white"
    }
  }

  const getStatusLabel = (status: Client["status"]) => {
    switch (status) {
      case "ahead":
        return "Ahead of Schedule"
      case "on-track":
        return "On Track"
      case "at-risk":
        return "Needs Attention"
    }
  }

  const getDirectorFromClinic = (clinic: string): string => {
    const director = CLINIC_DIRECTORS.find((d) => d.clinic === clinic)
    return director?.name || clinic
  }

  const filteredClients =
    showMyClientsOnly && selectedClinic !== "all"
      ? clients.filter((client) => client.clinic === selectedClinic)
      : clients

  if (loading) {
    return (
      <Card className="p-6 bg-white border-[#002855]/20 shadow-lg">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[#002855]">Client Engagements</h2>
          <p className="text-sm text-[#002855]/70">Active client projects and progress</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0077B6] mx-auto mb-4"></div>
            <p className="text-[#002855]/70">Loading client data...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 bg-white border-[#002855]/20 shadow-lg">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[#002855]">Client Engagements</h2>
          <p className="text-sm text-[#002855]/70">Active client projects and progress</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (clients.length === 0) {
    return (
      <Card className="p-6 bg-white border-[#002855]/20 shadow-lg">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[#002855]">Client Engagements</h2>
          <p className="text-sm text-[#002855]/70">Active client projects and progress</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-[#002855]/70">No client data available for this week</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-white border-[#002855]/20 shadow-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-3xl font-bold text-[#002855]">Client Engagements</h2>
            <p className="text-sm text-[#002855]/70">Active client projects and progress</p>
          </div>
          {selectedClinic !== "all" && (
            <div className="flex items-center gap-2">
              <Button
                variant={showMyClientsOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMyClientsOnly(true)}
                className={
                  showMyClientsOnly
                    ? "bg-[#0077B6] text-white hover:bg-[#005a8c]"
                    : "border-[#0077B6] text-[#0077B6] hover:bg-[#0077B6] hover:text-white"
                }
              >
                <User className="h-4 w-4 mr-1" />
                My Clients
              </Button>
              <Button
                variant={!showMyClientsOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMyClientsOnly(false)}
                className={
                  !showMyClientsOnly
                    ? "bg-[#0077B6] text-white hover:bg-[#005a8c]"
                    : "border-[#0077B6] text-[#0077B6] hover:bg-[#0077B6] hover:text-white"
                }
              >
                <Users className="h-4 w-4 mr-1" />
                All Clients
              </Button>
            </div>
          )}
        </div>
        {selectedClinic !== "all" && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="border-[#0077B6] text-[#0077B6]">
              {showMyClientsOnly
                ? `Showing ${filteredClients.length} client${filteredClients.length !== 1 ? "s" : ""} in ${selectedClinic} clinic`
                : `Showing all ${filteredClients.length} clients`}
            </Badge>
          </div>
        )}
      </div>

      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-6xl h-[90vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl font-bold text-[#002855]">{previewDoc?.file_name}</DialogTitle>
            <DialogDescription className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {previewDoc?.student_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {previewDoc && new Date(previewDoc.uploaded_at).toLocaleDateString()}
              </span>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="ml-auto border-[#0077B6] text-[#0077B6] hover:bg-[#0077B6] hover:text-white bg-transparent"
              >
                <a href={previewDoc?.file_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open in New Tab
                </a>
              </Button>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 w-full h-full px-6 pb-6">
            {previewDoc && (
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewDoc.file_url)}`}
                className="w-full h-full border-0 rounded-lg"
                title={previewDoc.file_name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {filteredClients.map((client) => {
          const progress = (client.hoursLogged / client.hoursTarget) * 100
          const colors = getClinicColor(client.clinic)
          const clientDocs = documents[client.name] || []

          return (
            <div
              key={client.id}
              className="rounded-lg border-2 bg-gradient-to-r from-white p-4 transition-all hover:shadow-md"
              style={{
                borderColor: `${colors.hex}40`,
                backgroundImage: `linear-gradient(to right, white, ${colors.hex}08)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.hex
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${colors.hex}40`
              }}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg ${colors.bg} p-2`}>
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#002855]">{client.name}</h3>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
                      <p className="text-base font-medium" style={{ color: colors.hex }}>
                        {client.clinic} Clinic
                      </p>
                    </div>
                    <p className="text-sm text-[#002855]/60 mt-1">Director: {client.director}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(client.status)}>{getStatusLabel(client.status)}</Badge>
                  <Dialog
                    open={uploadDialogOpen === client.id}
                    onOpenChange={(open) => setUploadDialogOpen(open ? client.id : null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#003478] text-[#003478] hover:bg-[#003478] hover:text-white bg-transparent"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload PPT
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Upload Presentations for {client.name}</DialogTitle>
                        <DialogDescription>
                          Upload PowerPoint presentations (.pptx, .ppt) for this client
                        </DialogDescription>
                      </DialogHeader>
                      <PresentationUpload
                        clientName={client.name}
                        onUploadComplete={(files) => {
                          console.log("[v0] Uploaded files:", files)
                          setTimeout(() => setUploadDialogOpen(null), 1500)
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="mb-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#002855]/70">Progress</span>
                  <span className="font-medium text-[#002855]">
                    {client.hoursLogged} / {client.hoursTarget} hours
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {client.recentWork.length > 0 && (
                <div className="mb-3 rounded-md bg-[#0096C7]/10 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#0077B6]" />
                    <span className="text-base font-bold text-[#002855]">Recent Work</span>
                  </div>
                  <ul className="space-y-1">
                    {client.recentWork.map((work, idx) => (
                      <li key={idx} className="text-sm text-[#002855]/80">
                        • {work.length > 80 ? `${work.substring(0, 80)}...` : work}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {client.teamMembers.length > 0 && (
                <div className="mb-3 rounded-md bg-blue-50/50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#0077B6]" />
                    <span className="text-base font-bold text-[#002855]">Project Team</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {client.teamMembers.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <User className="h-3 w-3 text-[#0077B6]" />
                        <div>
                          <div className="font-semibold text-[#002855]">{member.name}</div>
                          <div className="text-xs text-[#002855]/60">{member.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-[#002855]/70">
                    <Users className="h-4 w-4" />
                    <span>
                      {client.students} student{client.students !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[#002855]/70">
                    <Clock className="h-4 w-4" />
                    <span>{client.lastUpdate}</span>
                  </div>
                </div>
              </div>

              {clientDocs.length > 0 && (
                <div className="mt-4 rounded-lg bg-slate-50/50 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#0077B6]" />
                    <span className="text-base font-bold text-[#002855]">Documents ({clientDocs.length})</span>
                  </div>
                  <div className="space-y-4">
                    {clientDocs.map((doc) => {
                      const isPPTX =
                        doc.file_name.toLowerCase().endsWith(".pptx") || doc.file_name.toLowerCase().endsWith(".ppt")
                      const isMidtermPPT = isPPTX // All PPTX files are midterm presentations

                      const docEvaluations = evaluations[doc.id] || []
                      const docReviews = reviews[doc.id] || []
                      const evaluationsByDirector = new Map(docEvaluations.map((e) => [e.director_name, e]))
                      const currentDirectorName =
                        selectedClinic !== "all" ? getDirectorFromClinic(selectedClinic) : null
                      const currentDirectorEval = currentDirectorName
                        ? evaluationsByDirector.get(currentDirectorName)
                        : null
                      const allDirectorsEvaluated = CLINIC_DIRECTORS.every((dir) => evaluationsByDirector.has(dir.name))

                      return (
                        <div
                          key={doc.id}
                          className="rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <FileText className="h-4 w-4 text-[#0077B6]" />
                                <button
                                  onClick={() => !isPPTX && setPreviewDoc(doc)}
                                  className={`text-base font-semibold text-[#002855] text-left ${
                                    !isPPTX ? "hover:text-[#0077B6] hover:underline cursor-pointer" : "cursor-default"
                                  }`}
                                >
                                  {doc.file_name}
                                </button>
                                {isMidtermPPT ? (
                                  <Badge className="bg-purple-600 text-white text-xs h-5">Midterm Presentation</Badge>
                                ) : (
                                  doc.submission_type && (
                                    <Badge className="bg-[#0077B6] text-white text-xs h-5">{doc.submission_type}</Badge>
                                  )
                                )}
                                {isMidtermPPT && allDirectorsEvaluated ? (
                                  <Badge className="bg-green-500 text-white text-xs h-5">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    All Evaluations Complete
                                  </Badge>
                                ) : (
                                  isMidtermPPT && (
                                    <Badge className="bg-orange-500 text-white text-xs h-5 animate-pulse">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      {docEvaluations.length}/{CLINIC_DIRECTORS.length} Evaluations
                                    </Badge>
                                  )
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-600">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {doc.student_name}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(doc.uploaded_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {isPPTX ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="border-[#0077B6] text-[#0077B6] hover:bg-[#0077B6] hover:text-white bg-transparent h-7 text-xs"
                                >
                                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download>
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Download
                                  </a>
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPreviewDoc(doc)}
                                  className="border-[#0077B6] text-[#0077B6] hover:bg-[#0077B6] hover:text-white bg-transparent h-7 text-xs"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Preview
                                </Button>
                              )}
                            </div>
                          </div>

                          {doc.description && (
                            <div className="rounded bg-slate-50 p-2 mb-3">
                              <p className="text-xs text-slate-700">{doc.description}</p>
                            </div>
                          )}

                          {isMidtermPPT ? (
                            <>
                              {/* Full evaluation system for midterm PPTs */}
                              <div className="mt-4 p-4 bg-blue-50/50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <ClipboardList className="h-4 w-4 text-[#0077B6]" />
                                  <h5 className="text-sm font-bold text-[#002855]">Clinic Director Evaluations</h5>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                  {CLINIC_DIRECTORS.map((director) => {
                                    const hasEvaluated = evaluationsByDirector.has(director.name)
                                    const isCurrentDirector = currentDirectorName === director.name
                                    const clinicColor = getClinicColor(director.clinic)

                                    return (
                                      <div
                                        key={director.name}
                                        className={`flex items-center justify-between p-2 rounded-lg border-2 ${
                                          hasEvaluated
                                            ? "bg-green-50 border-green-300"
                                            : "bg-orange-50 border-orange-300"
                                        } ${isCurrentDirector ? "ring-2 ring-blue-500" : ""}`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: clinicColor.hex }}
                                          />
                                          <div>
                                            <p className="text-xs font-semibold text-[#002855]">{director.name}</p>
                                            <p className="text-[10px] text-[#002855]/60">{director.clinic}</p>
                                          </div>
                                        </div>
                                        {hasEvaluated ? (
                                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-orange-600" />
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>

                                {selectedClinic !== "all" && currentDirectorName ? (
                                  <Button
                                    onClick={() => setShowEvalForm(doc.id)}
                                    className={`w-full h-9 text-sm font-semibold ${
                                      !currentDirectorEval
                                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                                        : "bg-[#0077B6] hover:bg-[#005a8c] text-white"
                                    }`}
                                  >
                                    <ClipboardList className="h-4 w-4 mr-2" />
                                    {currentDirectorEval ? "Update Your Evaluation" : "Fill Out Your Evaluation"}
                                  </Button>
                                ) : (
                                  <div className="text-center p-3 bg-blue-100 rounded-lg border border-blue-300">
                                    <p className="text-xs text-blue-800 font-medium">
                                      Select your clinic from the dropdown above to fill out evaluations
                                    </p>
                                  </div>
                                )}
                              </div>

                              {showEvalForm === doc.id && currentDirectorName ? (
                                <div className="mt-4">
                                  <EvaluationForm
                                    documentId={doc.id}
                                    directorName={currentDirectorName}
                                    existingEvaluation={currentDirectorEval}
                                    onSubmit={() => {
                                      setShowEvalForm(null)
                                      fetchAllDocuments(clients)
                                    }}
                                    onCancel={() => setShowEvalForm(null)}
                                  />
                                </div>
                              ) : (
                                <>
                                  {docEvaluations.length > 0 && (
                                    <div className="mt-4">
                                      <EvaluationDisplay evaluations={docEvaluations} />
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              {/* Simple comments section for SOW documents */}
                              <div className="mt-4 p-4 bg-slate-50/50 rounded-lg border border-slate-200">
                                {selectedClinic !== "all" && currentDirectorName ? (
                                  <SimpleComments
                                    documentId={doc.id}
                                    directorName={currentDirectorName}
                                    existingReviews={docReviews}
                                    onSubmit={() => fetchAllDocuments(clients)}
                                  />
                                ) : (
                                  <div className="text-center p-3 bg-blue-100 rounded-lg border border-blue-300">
                                    <p className="text-xs text-blue-800 font-medium">
                                      Select your clinic from the dropdown above to add comments
                                    </p>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
