"use client"

import { useState, useEffect } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  UserCheck,
  FileText,
  Filter,
  ArrowUpDown,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProspectRecord {
  id: string
  fields: {
    "Student Name"?: string
    "Student Email"?: string
    "Interview Status"?: string
    "Interview Link"?: string
    "Prospect Acceptance Status copy"?: string
    Interviewer?:
      | Array<{
          id: string
          email: string
          name: string
        }>
      | string
    "Attachment Summary"?: any
    "Interview Date (time)"?: string
    "TXT: Interview Time"?: string
    "Interview Schedule"?: string
    "Director in Charge"?: string
    "Interviewer Name"?: string
    "PRESEED (Y/N) (from PRESEED| Interview)"?: string
    [key: string]: any
  }
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<ProspectRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormsNeededOpen, setIsFormsNeededOpen] = useState(false)
  const [filterBy, setFilterBy] = useState<"all" | "completed" | "upcoming">("all")
  const [sortBy, setSortBy] = useState<"name" | "date" | "status" | "interviewer">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    fetchProspects()
  }, [])

  const fetchProspects = async () => {
    try {
      console.log("[v0] Inspecting prospects table schema...")
      const inspectResponse = await fetch("/api/airtable/inspect")
      if (inspectResponse.ok) {
        const inspectData = await inspectResponse.json()
        const prospectsTable = inspectData.tables.find(
          (t: any) => t.name === "PRESEED| Prospects" || t.id === "tblnSMYowQYwYqaDG",
        )
        if (prospectsTable) {
          console.log("[v0] Prospects table fields:", prospectsTable.fields)
          console.log("[v0] Sample prospect record:", prospectsTable.sampleRecord)
        }
      }

      const response = await fetch("/api/airtable/prospects")

      if (!response.ok) {
        throw new Error("Failed to fetch prospects")
      }

      const data = await response.json()
      console.log("[v0] Total prospects fetched:", data.records?.length || 0)

      if (data.records && data.records.length > 0) {
        const allFieldNames = new Set<string>()
        data.records.forEach((record: ProspectRecord) => {
          Object.keys(record.fields).forEach((fieldName) => allFieldNames.add(fieldName))
        })
        console.log("[v0] All unique field names found in records:", Array.from(allFieldNames).sort())

        console.log("[v0] Sample records (first 3):")
        data.records.slice(0, 3).forEach((record: ProspectRecord, index: number) => {
          console.log(`[v0] Record ${index + 1} fields:`, Object.keys(record.fields))
          console.log(`[v0] Record ${index + 1} data:`, record.fields)
        })
      }

      const uniqueProspects = new Map<string, ProspectRecord>()

      data.records?.forEach((record: ProspectRecord) => {
        const email = record.fields["Student Email"]
        if (email) {
          const existing = uniqueProspects.get(email)
          if (!existing) {
            uniqueProspects.set(email, record)
          } else {
            const existingFieldCount = Object.values(existing.fields).filter(
              (v) => v !== null && v !== undefined && v !== "",
            ).length
            const newFieldCount = Object.values(record.fields).filter(
              (v) => v !== null && v !== undefined && v !== "",
            ).length

            if (newFieldCount > existingFieldCount) {
              uniqueProspects.set(email, record)
            }
          }
        } else {
          const name = record.fields["Student Name"] || "Unknown"
          const key = `${name}_${record.id}`
          uniqueProspects.set(key, record)
        }
      })

      const deduplicatedRecords = Array.from(uniqueProspects.values())
      console.log("[v0] After deduplication:", deduplicatedRecords.length, "unique prospects")

      setProspects(deduplicatedRecords)
    } catch (err) {
      console.error("[v0] Error fetching prospects:", err)
      setError(err instanceof Error ? err.message : "Failed to load prospects")
    } finally {
      setLoading(false)
    }
  }

  const getProspectName = (fields: ProspectRecord["fields"]) => {
    return fields["Student Name"] || fields["Name"] || fields["Prospect Name"] || fields["Student"] || "Unknown"
  }

  const getInterviewStatus = (fields: ProspectRecord["fields"]) => {
    return fields["Interview Status"] || fields["Status"] || fields["Interview State"] || "Pending"
  }

  const getAcceptanceStatus = (fields: ProspectRecord["fields"]) => {
    return (
      fields["Prospect Acceptance Status copy"] ||
      fields["Acceptance Status"] ||
      fields["Status"] ||
      fields["Prospect Status"] ||
      "Unknown"
    )
  }

  const getInterviewerName = (fields: ProspectRecord["fields"]) => {
    if (fields.Interviewer && Array.isArray(fields.Interviewer) && fields.Interviewer.length > 0) {
      return fields.Interviewer[0].name
    }
    if (fields["Director in Charge"]) {
      return fields["Director in Charge"]
    }
    if (fields.Interviewer && typeof fields.Interviewer === "string") {
      return fields.Interviewer
    }
    if (fields["Interviewer Name"]) {
      return fields["Interviewer Name"]
    }
    return "—"
  }

  const getInterviewLink = (fields: ProspectRecord["fields"]) => {
    return fields["Interview Link"] || fields["Zoom Link"] || fields["Meeting Link"] || fields["Link"] || null
  }

  const getInterviewDateTime = (fields: ProspectRecord["fields"]) => {
    if (fields["Interview Date (time)"]) {
      const dateStr = fields["Interview Date (time)"]
      try {
        const date = new Date(dateStr)
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        const formattedTime = date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        const timeStr = fields["TXT: Interview Time"] || fields["Interview Time"]
        if (timeStr) {
          return `${formattedDate} at ${timeStr}`
        }
        return `${formattedDate} at ${formattedTime}`
      } catch (e) {
        return dateStr
      }
    }

    if (fields["Interview Schedule"]) {
      return fields["Interview Schedule"]
    }

    const date = fields["Interview Date"] || fields["Date"] || fields["Scheduled Date"]
    const time = fields["Interview Time"] || fields["Time"] || fields["Scheduled Time"] || fields["TXT: Interview Time"]

    if (date && time) {
      return `${date} at ${time}`
    }
    if (date) {
      return date
    }
    return null
  }

  const isInterviewCompleted = (fields: ProspectRecord["fields"]) => {
    const interviewDateStr = fields["Interview Date (time)"]
    if (!interviewDateStr) return false

    try {
      const interviewDate = new Date(interviewDateStr)
      const now = new Date()
      return interviewDate < now
    } catch (e) {
      return false
    }
  }

  const totalProspects = prospects.length

  const scheduledInterviews = prospects.filter((p) => {
    const interviewDateStr = p.fields["Interview Date (time)"]
    if (!interviewDateStr) return false

    try {
      const interviewDate = new Date(interviewDateStr)
      const now = new Date()
      return interviewDate >= now
    } catch (e) {
      return false
    }
  }).length

  const completedInterviews = prospects.filter((p) => isInterviewCompleted(p.fields)).length

  const pendingReview = prospects.filter((p) => {
    const status = getAcceptanceStatus(p.fields).toLowerCase()
    return status === "invited" || status === "pending"
  }).length

  const completedInterviewsWithoutForm = prospects.filter((p) => {
    const isCompleted = isInterviewCompleted(p.fields)
    const formCompleted = p.fields["PRESEED (Y/N) (from PRESEED| Interview)"]
    return isCompleted && (!formCompleted || formCompleted !== "Yes")
  })

  const completedInterviewsWithForm = prospects.filter((p) => {
    const formCompleted = p.fields["PRESEED (Y/N) (from PRESEED| Interview)"]
    return formCompleted === "Yes"
  })

  const scheduledList = prospects
    .filter((p) => {
      const interviewDateStr = p.fields["Interview Date (time)"]
      if (!interviewDateStr) return false

      try {
        const interviewDate = new Date(interviewDateStr)
        const now = new Date()
        return interviewDate >= now
      } catch (e) {
        return false
      }
    })
    .sort((a, b) => {
      const dateA = new Date(a.fields["Interview Date (time)"] || 0)
      const dateB = new Date(b.fields["Interview Date (time)"] || 0)
      return dateA.getTime() - dateB.getTime() // Sort by soonest first
    })
    .slice(0, 5)

  const recentInterviews = prospects.filter((p) => isInterviewCompleted(p.fields)).slice(0, 5)

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase()

    if (normalizedStatus === "completed") {
      return <Badge className="bg-green-500">{status}</Badge>
    }
    if (normalizedStatus === "scheduled") {
      return <Badge className="bg-blue-500">{status}</Badge>
    }
    if (normalizedStatus === "cancelled") {
      return <Badge variant="destructive">{status}</Badge>
    }
    if (normalizedStatus === "no show") {
      return <Badge className="bg-amber-500">{status}</Badge>
    }
    return <Badge variant="secondary">{status}</Badge>
  }

  const getAcceptanceBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase()

    if (normalizedStatus === "accepted") {
      return <Badge className="bg-green-500">{status}</Badge>
    }
    if (normalizedStatus === "invited") {
      return <Badge className="bg-blue-500">{status}</Badge>
    }
    if (normalizedStatus === "declined") {
      return <Badge variant="destructive">{status}</Badge>
    }
    return <Badge variant="secondary">{status}</Badge>
  }

  const getSortedProspects = (prospectsToSort: ProspectRecord[]) => {
    const sorted = [...prospectsToSort].sort((a, b) => {
      let compareA: any
      let compareB: any

      switch (sortBy) {
        case "name":
          compareA = getProspectName(a.fields).toLowerCase()
          compareB = getProspectName(b.fields).toLowerCase()
          break
        case "date":
          compareA = a.fields["Interview Date (time)"] || ""
          compareB = b.fields["Interview Date (time)"] || ""
          break
        case "status":
          compareA = getInterviewStatus(a.fields).toLowerCase()
          compareB = getInterviewStatus(b.fields).toLowerCase()
          break
        case "interviewer":
          compareA = getInterviewerName(a.fields).toLowerCase()
          compareB = getInterviewerName(b.fields).toLowerCase()
          break
        default:
          return 0
      }

      if (compareA < compareB) return sortOrder === "asc" ? -1 : 1
      if (compareA > compareB) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    return sorted
  }

  const getFilteredProspects = () => {
    let filtered = prospects

    if (filterBy === "completed") {
      filtered = prospects.filter((p) => isInterviewCompleted(p.fields))
    } else if (filterBy === "upcoming") {
      filtered = prospects.filter((p) => {
        const interviewDateStr = p.fields["Interview Date (time)"]
        if (!interviewDateStr) return false

        try {
          const interviewDate = new Date(interviewDateStr)
          const now = new Date()
          return interviewDate >= now
        } catch (e) {
          return false
        }
      })
    }

    return getSortedProspects(filtered)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading prospects data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <div className="container mx-auto p-6">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Error Loading Prospects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchProspects} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <MainNavigation />

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between bg-slate-800 text-white rounded-lg p-6 shadow-sm border border-slate-700/20">
          <div>
            <h1 className="text-3xl font-bold">Prospect Interview Dashboard</h1>
            <p className="mt-1 opacity-90">Track and manage prospect interviews for PRESEED program</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button
              size="lg"
              onClick={() => window.open("https://airtable.com/appv3eSA0Ab2lJLe0/pagr17MqbIGB0UuAl/form", "_blank")}
              className="bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Fill Out Interview Form
            </Button>
            <p className="text-xs opacity-90">
              Password: <span className="font-mono font-semibold bg-white/20 px-2 py-1 rounded">SEED2025</span>
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border border-slate-200/60 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Total Prospects</CardTitle>
              <Users className="h-5 w-5 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{totalProspects}</div>
              <p className="text-xs text-slate-500 mt-1">All prospect candidates</p>
            </CardContent>
          </Card>

          <Card className="border border-blue-200/60 shadow-sm bg-blue-50/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Scheduled Interviews</CardTitle>
              <Calendar className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{scheduledInterviews}</div>
              <p className="text-xs text-blue-600 mt-1">Upcoming interviews</p>
            </CardContent>
          </Card>

          <Card className="border border-amber-200/60 shadow-sm bg-amber-50/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-800">Forms Needed</CardTitle>
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900">{completedInterviewsWithoutForm.length}</div>
              <p className="text-xs text-amber-600 mt-1">Interviews missing forms</p>
            </CardContent>
          </Card>

          <Card className="border border-teal-200/60 shadow-sm bg-teal-50/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-teal-800">Forms Completed</CardTitle>
              <CheckCircle className="h-5 w-5 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-900">{completedInterviewsWithForm.length}</div>
              <p className="text-xs text-teal-600 mt-1">Fully documented</p>
            </CardContent>
          </Card>
        </div>

        {completedInterviewsWithoutForm.length > 0 && (
          <Collapsible open={isFormsNeededOpen} onOpenChange={setIsFormsNeededOpen}>
            <Card className="border border-amber-200/60 shadow-sm bg-white">
              <CardHeader className="bg-amber-50/50 border-b border-amber-200/60">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      <div>
                        <CardTitle className="text-slate-900">Completed Interviews - Form Needed</CardTitle>
                        <CardDescription className="text-slate-600">
                          These interviews have passed their scheduled date but the interview form has not been
                          submitted yet
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 text-sm px-2 py-1">
                        {completedInterviewsWithoutForm.length}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                      {isFormsNeededOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                  </div>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50">
                          <TableHead className="text-slate-700">Name</TableHead>
                          <TableHead className="text-slate-700">Email</TableHead>
                          <TableHead className="text-slate-700">Interviewer</TableHead>
                          <TableHead className="text-slate-700">Interview Schedule</TableHead>
                          <TableHead className="text-slate-700">Status</TableHead>
                          <TableHead className="text-slate-700">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completedInterviewsWithoutForm.map((prospect) => (
                          <TableRow key={prospect.id} className="hover:bg-slate-50/50">
                            <TableCell className="font-medium">{getProspectName(prospect.fields)}</TableCell>
                            <TableCell className="text-sm">{prospect.fields["Student Email"] || "—"}</TableCell>
                            <TableCell className="text-sm">{getInterviewerName(prospect.fields)}</TableCell>
                            <TableCell className="text-sm font-medium">
                              {getInterviewDateTime(prospect.fields) || "—"}
                            </TableCell>
                            <TableCell>{getStatusBadge(getInterviewStatus(prospect.fields))}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                className="bg-amber-500 hover:bg-amber-600 text-white"
                                onClick={() =>
                                  window.open("https://airtable.com/appv3eSA0Ab2lJLe0/pagr17MqbIGB0UuAl/form", "_blank")
                                }
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Fill Form
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {completedInterviewsWithForm.length > 0 && (
          <Card className="border border-teal-200/60 shadow-sm bg-white">
            <CardHeader className="bg-teal-50/50 border-b border-teal-200/60">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-teal-500" />
                <div>
                  <CardTitle className="text-slate-900">Completed Interview Forms</CardTitle>
                  <CardDescription className="text-slate-600">Interviews with completed documentation</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="text-slate-700">Name</TableHead>
                      <TableHead className="text-slate-700">Email</TableHead>
                      <TableHead className="text-slate-700">Interviewer</TableHead>
                      <TableHead className="text-slate-700">Interview Schedule</TableHead>
                      <TableHead className="text-slate-700">Acceptance Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedInterviewsWithForm.map((prospect) => (
                      <TableRow key={prospect.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium">{getProspectName(prospect.fields)}</TableCell>
                        <TableCell className="text-sm">{prospect.fields["Student Email"] || "—"}</TableCell>
                        <TableCell className="text-sm">{getInterviewerName(prospect.fields)}</TableCell>
                        <TableCell className="text-sm font-medium">
                          {getInterviewDateTime(prospect.fields) || "—"}
                        </TableCell>
                        <TableCell>{getAcceptanceBadge(getAcceptanceStatus(prospect.fields))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border border-blue-200/60 shadow-sm bg-white">
            <CardHeader className="bg-blue-50/50 border-b border-blue-200/60">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <CardTitle className="text-slate-900">Scheduled Interviews</CardTitle>
                  <CardDescription className="text-slate-600">Upcoming prospect interviews</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {scheduledList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <Calendar className="h-12 w-12 mb-2 opacity-20" />
                  <p>No scheduled interviews</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledList.map((prospect) => (
                    <div
                      key={prospect.id}
                      className="flex items-center justify-between border-l-4 border-blue-300 bg-blue-50/50 p-4 rounded-r-lg hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-lg text-slate-900">{getProspectName(prospect.fields)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <p className="text-sm text-blue-800 font-medium">
                            {getInterviewDateTime(prospect.fields) || "Date/Time TBD"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <UserCheck className="h-4 w-4 text-slate-400" />
                          <p className="text-xs text-slate-600">Interviewer: {getInterviewerName(prospect.fields)}</p>
                        </div>
                        {getInterviewLink(prospect.fields) && (
                          <a
                            href={getInterviewLink(prospect.fields)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Join Interview
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {getStatusBadge(getInterviewStatus(prospect.fields))}
                        {getAcceptanceBadge(getAcceptanceStatus(prospect.fields))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200/60 shadow-sm bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-200/60">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-slate-500" />
                <div>
                  <CardTitle className="text-slate-900">All Completed Interviews</CardTitle>
                  <CardDescription className="text-slate-600">
                    Interviews with past scheduled dates ({completedInterviews} total)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {completedInterviews === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mb-2 opacity-20" />
                  <p>No completed interviews</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {prospects
                    .filter((p) => isInterviewCompleted(p.fields))
                    .map((prospect) => {
                      const formCompleted = prospect.fields["PRESEED (Y/N) (from PRESEED| Interview)"] === "Yes"
                      return (
                        <div
                          key={prospect.id}
                          className={`flex items-center justify-between border-l-4 ${
                            formCompleted ? "border-teal-300 bg-teal-50/50" : "border-amber-300 bg-amber-50/50"
                          } p-4 rounded-r-lg hover:opacity-80 transition-opacity`}
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{getProspectName(prospect.fields)}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <UserCheck className="h-3 w-3 text-slate-400" />
                              <p className="text-xs text-slate-600">
                                Interviewer: {getInterviewerName(prospect.fields)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3 text-slate-400" />
                              <p className="text-xs text-slate-600 font-medium">
                                Scheduled: {getInterviewDateTime(prospect.fields) || "—"}
                              </p>
                            </div>
                            {!formCompleted && (
                              <div className="flex items-center gap-1 mt-2">
                                <AlertCircle className="h-3 w-3 text-amber-500" />
                                <p className="text-xs text-amber-600 font-medium">Form needed</p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {formCompleted ? (
                              <Badge className="bg-teal-500 text-white">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Form Complete
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500 text-white">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Form Pending
                              </Badge>
                            )}
                            {getAcceptanceBadge(getAcceptanceStatus(prospect.fields))}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200/60 shadow-sm bg-white">
          <CardHeader className="bg-slate-800 text-white border-b border-slate-700/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                <div>
                  <CardTitle>All Prospects</CardTitle>
                  <CardDescription className="text-white/80">
                    Complete list of prospect candidates ({getFilteredProspects().length} shown)
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-white" />
                <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                  <SelectTrigger className="w-[180px] bg-white text-slate-900">
                    <SelectValue placeholder="Filter by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prospects</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                  </SelectContent>
                </Select>
                <ArrowUpDown className="h-4 w-4 text-white ml-2" />
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[180px] bg-white text-slate-900">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="date">Interview Date</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="interviewer">Interviewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="text-white hover:bg-white/10"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {getFilteredProspects().length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Users className="h-12 w-12 mb-2 opacity-20" />
                <p>No prospects found for this filter</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Name</TableHead>
                      <TableHead className="font-semibold text-slate-700">Email</TableHead>
                      <TableHead className="font-semibold text-slate-700">Interviewer</TableHead>
                      <TableHead className="font-semibold text-slate-700">Interview Schedule</TableHead>
                      <TableHead className="font-semibold text-slate-700">Interview Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acceptance Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Interview Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredProspects().map((prospect) => (
                      <TableRow key={prospect.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium">{getProspectName(prospect.fields)}</TableCell>
                        <TableCell className="text-sm">{prospect.fields["Student Email"] || "—"}</TableCell>
                        <TableCell className="text-sm">{getInterviewerName(prospect.fields)}</TableCell>
                        <TableCell className="text-sm font-medium">
                          {getInterviewDateTime(prospect.fields) || "—"}
                        </TableCell>
                        <TableCell>{getStatusBadge(getInterviewStatus(prospect.fields))}</TableCell>
                        <TableCell>{getAcceptanceBadge(getAcceptanceStatus(prospect.fields))}</TableCell>
                        <TableCell>
                          {getInterviewLink(prospect.fields) ? (
                            <a
                              href={getInterviewLink(prospect.fields)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Join
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
