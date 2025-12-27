"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  Building,
  Plus,
  Users,
  AlertCircle,
} from "lucide-react"
import { MainNavigation } from "@/components/main-navigation"

interface ProspectRecord {
  id: string
  fields: {
    "Student Name"?: string
    Name?: string
    "Prospect Name"?: string
    Student?: string
    "Student Email"?: string
    Email?: string
    "Student Phone"?: string
    Phone?: string
    "Interview Date"?: string
    Date?: string
    "Scheduled Date"?: string
    "Interview Time"?: string
    Time?: string
    "Interview Status"?: string
    Status?: string
    "Interview State"?: string
    Interviewer?: string
    "Assigned Director"?: string
    Director?: string
    Notes?: string
    "Interview Notes"?: string
    "Preferred Clinic"?: string
    Clinic?: string
    "Clinic Preference"?: string
    Resume?: { url: string }[]
    "Resume URL"?: string
    [key: string]: any
  }
}

const mockProspects: ProspectRecord[] = [
  {
    id: "1",
    fields: {
      "Student Name": "John Smith",
      "Student Email": "john.smith@example.com",
      "Student Phone": "555-0101",
      "Interview Date": "2025-01-15",
      "Interview Time": "10:00 AM",
      "Interview Status": "Completed",
      Interviewer: "Beth DiRusso",
      "Preferred Clinic": "Consulting",
      Notes: "Strong candidate with good communication skills",
    },
  },
  {
    id: "2",
    fields: {
      "Student Name": "Jane Doe",
      "Student Email": "jane.doe@example.com",
      "Student Phone": "555-0102",
      "Interview Date": "2025-01-16",
      "Interview Time": "2:00 PM",
      "Interview Status": "Scheduled",
      Interviewer: "Mark Dwyer",
      "Preferred Clinic": "Accounting",
    },
  },
  {
    id: "3",
    fields: {
      "Student Name": "Mike Johnson",
      "Student Email": "mike.johnson@example.com",
      "Student Phone": "555-0103",
      "Interview Date": "2025-01-14",
      "Interview Time": "11:00 AM",
      "Interview Status": "Pending",
      Interviewer: "Nick Vadala",
      "Preferred Clinic": "Marketing",
    },
  },
]

export default function ProspectInterviewsPage() {
  const [prospects, setProspects] = useState<ProspectRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setProspects(mockProspects)
    setLoading(false)
  }, [])

  const getProspectName = (fields: ProspectRecord["fields"]) => {
    return fields["Student Name"] || fields["Name"] || fields["Prospect Name"] || fields["Student"] || "Unknown"
  }

  const getInterviewStatus = (fields: ProspectRecord["fields"]) => {
    return fields["Interview Status"] || fields["Status"] || fields["Interview State"] || "Pending"
  }

  const getInterviewDate = (fields: ProspectRecord["fields"]) => {
    return fields["Interview Date"] || fields["Date"] || fields["Scheduled Date"]
  }

  const getInterviewTime = (fields: ProspectRecord["fields"]) => {
    return fields["Interview Time"] || fields["Time"] || ""
  }

  const getEmail = (fields: ProspectRecord["fields"]) => {
    return fields["Student Email"] || fields["Email"] || ""
  }

  const getPhone = (fields: ProspectRecord["fields"]) => {
    return fields["Student Phone"] || fields["Phone"] || ""
  }

  const getInterviewer = (fields: ProspectRecord["fields"]) => {
    return fields["Interviewer"] || fields["Assigned Director"] || fields["Director"] || "Unassigned"
  }

  const getClinic = (fields: ProspectRecord["fields"]) => {
    return fields["Preferred Clinic"] || fields["Clinic"] || fields["Clinic Preference"] || "Not specified"
  }

  const getNotes = (fields: ProspectRecord["fields"]) => {
    return fields["Notes"] || fields["Interview Notes"] || ""
  }

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    if (normalizedStatus.includes("complete") || normalizedStatus.includes("done")) {
      return "bg-green-100 text-green-800 border-green-200"
    }
    if (normalizedStatus.includes("schedule") || normalizedStatus.includes("confirm")) {
      return "bg-blue-100 text-blue-800 border-blue-200"
    }
    if (normalizedStatus.includes("cancel") || normalizedStatus.includes("no show")) {
      return "bg-red-100 text-red-800 border-red-200"
    }
    return "bg-yellow-100 text-yellow-800 border-yellow-200"
  }

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    if (normalizedStatus.includes("complete") || normalizedStatus.includes("done")) {
      return <CheckCircle className="h-4 w-4" />
    }
    if (normalizedStatus.includes("cancel") || normalizedStatus.includes("no show")) {
      return <XCircle className="h-4 w-4" />
    }
    return <Clock className="h-4 w-4" />
  }

  const completedCount = prospects.filter((p) => {
    const status = getInterviewStatus(p.fields).toLowerCase()
    return status.includes("complete") || status.includes("done")
  }).length

  const scheduledCount = prospects.filter((p) => {
    const status = getInterviewStatus(p.fields).toLowerCase()
    return status.includes("schedule") || status.includes("confirm")
  }).length

  const pendingCount = prospects.filter((p) => {
    const status = getInterviewStatus(p.fields).toLowerCase()
    return !status.includes("complete") && !status.includes("done") && !status.includes("schedule")
  }).length

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
          <MainNavigation />
        </aside>
        <div className="pl-52 pt-14 flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
          <MainNavigation />
        </aside>
        <div className="pl-52 pt-14 flex items-center justify-center h-screen">
          <Card className="p-6 max-w-md">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Prospects</h2>
              <p className="text-slate-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>

      <div className="pl-52 pt-14">
        <main className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Pre-SEED Prospect Interviews</h1>
              <p className="text-slate-600 text-sm">Track and manage prospective student interviews</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="h-4 w-4" />
              Add New Prospect
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-[#4A6FA5]/10">
                    <Users className="h-6 w-6 text-[#4A6FA5]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{prospects.length}</p>
                    <p className="text-sm text-slate-600">Total Prospects</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-900">{completedCount}</p>
                    <p className="text-sm text-green-700">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{scheduledCount}</p>
                    <p className="text-sm text-blue-700">Scheduled</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-yellow-500/10">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
                    <p className="text-sm text-yellow-700">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Prospects</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle>All Prospects</CardTitle>
                  <CardDescription>Complete list of all prospective students</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {prospects.map((prospect) => (
                      <ProspectCard
                        key={prospect.id}
                        prospect={prospect}
                        getProspectName={getProspectName}
                        getInterviewStatus={getInterviewStatus}
                        getInterviewDate={getInterviewDate}
                        getInterviewTime={getInterviewTime}
                        getEmail={getEmail}
                        getPhone={getPhone}
                        getInterviewer={getInterviewer}
                        getClinic={getClinic}
                        getNotes={getNotes}
                        getStatusColor={getStatusColor}
                        getStatusIcon={getStatusIcon}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scheduled">
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Interviews</CardTitle>
                  <CardDescription>Upcoming interviews that have been confirmed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {prospects
                      .filter((p) => {
                        const status = getInterviewStatus(p.fields).toLowerCase()
                        return status.includes("schedule") || status.includes("confirm")
                      })
                      .map((prospect) => (
                        <ProspectCard
                          key={prospect.id}
                          prospect={prospect}
                          getProspectName={getProspectName}
                          getInterviewStatus={getInterviewStatus}
                          getInterviewDate={getInterviewDate}
                          getInterviewTime={getInterviewTime}
                          getEmail={getEmail}
                          getPhone={getPhone}
                          getInterviewer={getInterviewer}
                          getClinic={getClinic}
                          getNotes={getNotes}
                          getStatusColor={getStatusColor}
                          getStatusIcon={getStatusIcon}
                        />
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completed">
              <Card>
                <CardHeader>
                  <CardTitle>Completed Interviews</CardTitle>
                  <CardDescription>Interviews that have been conducted</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {prospects
                      .filter((p) => {
                        const status = getInterviewStatus(p.fields).toLowerCase()
                        return status.includes("complete") || status.includes("done")
                      })
                      .map((prospect) => (
                        <ProspectCard
                          key={prospect.id}
                          prospect={prospect}
                          getProspectName={getProspectName}
                          getInterviewStatus={getInterviewStatus}
                          getInterviewDate={getInterviewDate}
                          getInterviewTime={getInterviewTime}
                          getEmail={getEmail}
                          getPhone={getPhone}
                          getInterviewer={getInterviewer}
                          getClinic={getClinic}
                          getNotes={getNotes}
                          getStatusColor={getStatusColor}
                          getStatusIcon={getStatusIcon}
                        />
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Interviews</CardTitle>
                  <CardDescription>Prospects awaiting interview scheduling</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {prospects
                      .filter((p) => {
                        const status = getInterviewStatus(p.fields).toLowerCase()
                        return !status.includes("complete") && !status.includes("done") && !status.includes("schedule")
                      })
                      .map((prospect) => (
                        <ProspectCard
                          key={prospect.id}
                          prospect={prospect}
                          getProspectName={getProspectName}
                          getInterviewStatus={getInterviewStatus}
                          getInterviewDate={getInterviewDate}
                          getInterviewTime={getInterviewTime}
                          getEmail={getEmail}
                          getPhone={getPhone}
                          getInterviewer={getInterviewer}
                          getClinic={getClinic}
                          getNotes={getNotes}
                          getStatusColor={getStatusColor}
                          getStatusIcon={getStatusIcon}
                        />
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

function ProspectCard({
  prospect,
  getProspectName,
  getInterviewStatus,
  getInterviewDate,
  getInterviewTime,
  getEmail,
  getPhone,
  getInterviewer,
  getClinic,
  getNotes,
  getStatusColor,
  getStatusIcon,
}: {
  prospect: ProspectRecord
  getProspectName: (fields: ProspectRecord["fields"]) => string
  getInterviewStatus: (fields: ProspectRecord["fields"]) => string
  getInterviewDate: (fields: ProspectRecord["fields"]) => string | undefined
  getInterviewTime: (fields: ProspectRecord["fields"]) => string
  getEmail: (fields: ProspectRecord["fields"]) => string
  getPhone: (fields: ProspectRecord["fields"]) => string
  getInterviewer: (fields: ProspectRecord["fields"]) => string
  getClinic: (fields: ProspectRecord["fields"]) => string
  getNotes: (fields: ProspectRecord["fields"]) => string
  getStatusColor: (status: string) => string
  getStatusIcon: (status: string) => React.ReactNode
}) {
  const status = getInterviewStatus(prospect.fields)
  const date = getInterviewDate(prospect.fields)
  const time = getInterviewTime(prospect.fields)

  return (
    <div className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-slate-900">{getProspectName(prospect.fields)}</h3>
            <Badge className={`${getStatusColor(status)} flex items-center gap-1`}>
              {getStatusIcon(status)}
              {status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {date && (
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(date).toLocaleDateString()}
                  {time && ` at ${time}`}
                </span>
              </div>
            )}

            {getEmail(prospect.fields) && (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="h-4 w-4" />
                <span>{getEmail(prospect.fields)}</span>
              </div>
            )}

            {getPhone(prospect.fields) && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="h-4 w-4" />
                <span>{getPhone(prospect.fields)}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-slate-600">
              <User className="h-4 w-4" />
              <span>{getInterviewer(prospect.fields)}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Building className="h-4 w-4" />
              <span>{getClinic(prospect.fields)}</span>
            </div>
          </div>

          {getNotes(prospect.fields) && (
            <p className="mt-3 text-sm text-slate-500 italic">{getNotes(prospect.fields)}</p>
          )}
        </div>
      </div>
    </div>
  )
}
