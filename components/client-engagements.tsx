"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import { Building2, Users, Clock, AlertCircle, FileText, ExternalLink, CheckCircle2 } from "lucide-react"
import { getClinicColor } from "@/lib/clinic-colors"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
  submission_type?: string
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
}

interface ClientEngagementsProps {
  selectedWeeks: string[]
  selectedClinic: string
}

const CLINIC_DIRECTORS = [
  { name: "Nick Vadala", clinic: "Consulting" },
  { name: "Mark Dwyer", clinic: "Accounting" },
  { name: "Ken Mooney", clinic: "Funding" },
  { name: "Chris Hill", clinic: "Marketing" },
]

export function ClientEngagements({ selectedWeeks, selectedClinic }: ClientEngagementsProps) {
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
          fetch("/api/supabase/clients"),
          fetch("/api/supabase/debriefs"),
        ])

        if (!clientsRes.ok || !debriefsRes.ok) {
          throw new Error("Failed to fetch data from Supabase")
        }

        const clientsData = await clientsRes.json()
        const debriefsData = await debriefsRes.json()

        const clientMap = new Map<string, Client>()

        // Process clients from Supabase
        if (clientsData.records) {
          clientsData.records.forEach((record: any) => {
            const fields = record.fields
            const clientName = fields["Name"] || "Unknown Client"
            const directorLead = fields["Director Lead"] || "Director TBD"

            // Determine clinic from director
            let clientClinic = "Unknown"
            CLINIC_DIRECTORS.forEach((dir) => {
              if (directorLead.includes(dir.name)) {
                clientClinic = dir.clinic
              }
            })

            const matchesClinic = selectedClinic === "all" || clientClinic === selectedClinic

            if (matchesClinic) {
              clientMap.set(record.id, {
                id: record.id,
                name: clientName,
                clinic: clientClinic,
                director: directorLead,
                students: 0,
                hoursLogged: 0,
                hoursTarget: 60,
                status: "on-track",
                lastUpdate: "No updates yet",
                recentWork: [],
                teamMembers: [],
              })
            }
          })
        }

        // Process debriefs to get hours and student counts
        if (debriefsData.debriefs) {
          const studentsByClient = new Map<string, Set<string>>()
          const hoursByClient = new Map<string, number>()
          const latestUpdateByClient = new Map<string, Date>()
          const recentWorkByClient = new Map<string, string[]>()

          debriefsData.debriefs.forEach((debrief: any) => {
            const weekEnding = debrief.weekEnding
            const clinic = debrief.clinic
            const matchesClinic = selectedClinic === "all" || clinic === selectedClinic

            const matchesWeek = selectedWeeks.length === 0 || selectedWeeks.includes(weekEnding)

            if (matchesWeek && matchesClinic) {
              const clientName = debrief.clientName
              const studentName = debrief.studentName
              const hours = debrief.hoursWorked || 0
              const workDescription = debrief.workSummary

              // Find client by name
              clientMap.forEach((client, clientId) => {
                if (client.name === clientName || clientName?.includes(client.name)) {
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
                    const date = new Date(weekEnding)
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
          })

          // Update client data with aggregated info
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
        console.error("Error fetching data:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedWeeks, selectedClinic])

  const fetchAllDocuments = async (clientsList: Client[]) => {
    try {
      const docsRes = await fetch("/api/documents")
      if (docsRes.ok) {
        const docsData = await docsRes.json()
        const docsByClient: Record<string, Document[]> = {}

        docsData.documents?.forEach((doc: Document) => {
          const clientName = doc.client_name
          if (!docsByClient[clientName]) {
            docsByClient[clientName] = []
          }
          docsByClient[clientName].push(doc)
        })

        setDocuments(docsByClient)
      }
    } catch (err) {
      console.error("Error fetching documents:", err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ahead":
        return "bg-green-100 text-green-800 border-green-200"
      case "on-track":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "at-risk":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ahead":
        return <CheckCircle2 className="h-4 w-4" />
      case "on-track":
        return <Clock className="h-4 w-4" />
      case "at-risk":
        return <AlertCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p>Error loading client engagements: {error}</p>
        </div>
      </Card>
    )
  }

  if (clients.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No client engagements found for selected filters</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1">
            <Building2 className="h-3 w-3" />
            {clients.length} Clients
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {clients.reduce((sum, c) => sum + c.students, 0)} Students
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {clients.reduce((sum, c) => sum + c.hoursLogged, 0).toFixed(1)} Hours
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => {
          const colors = getClinicColor(client.clinic)
          const clientDocs = documents[client.name] || []
          const progress = Math.min((client.hoursLogged / client.hoursTarget) * 100, 100)

          return (
            <Card
              key={client.id}
              className="p-6 hover:shadow-lg transition-shadow border-l-4"
              style={{ borderLeftColor: colors.hex }}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.director}</p>
                  </div>
                  <Badge className={getStatusColor(client.status)}>
                    {getStatusIcon(client.status)}
                    <span className="ml-1 capitalize">{client.status.replace("-", " ")}</span>
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {client.hoursLogged.toFixed(1)} / {client.hoursTarget}h
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{client.students} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{clientDocs.length} docs</span>
                  </div>
                </div>

                {client.recentWork.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Recent Work:</p>
                    <ul className="text-sm space-y-1">
                      {client.recentWork.slice(0, 2).map((work, i) => (
                        <li key={i} className="text-muted-foreground truncate">
                          • {work}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <FileText className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{client.name}</DialogTitle>
                        <DialogDescription>Client engagement details and documents</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Director</p>
                            <p className="text-sm text-muted-foreground">{client.director}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Clinic</p>
                            <p className="text-sm text-muted-foreground">{client.clinic}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Students</p>
                            <p className="text-sm text-muted-foreground">{client.students}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Hours Logged</p>
                            <p className="text-sm text-muted-foreground">{client.hoursLogged.toFixed(1)}h</p>
                          </div>
                        </div>

                        {clientDocs.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Documents</p>
                            <div className="space-y-2">
                              {clientDocs.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{doc.file_name}</span>
                                  </div>
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
