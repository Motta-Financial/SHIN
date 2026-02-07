"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Building2, ChevronDown, ChevronRight, Mail, Briefcase, Crown, UserCircle } from "lucide-react"

interface Director {
  id: string
  full_name: string
  email: string
  job_title: string | null
  clinic_id: string | null
}

interface Student {
  id: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  is_team_leader: boolean
  client_id: string | null
  clinic_id: string | null
}

interface Client {
  id: string
  name: string
  status: string
}

interface Clinic {
  id: string
  name: string
}

interface ClinicData {
  clinic: Clinic
  directors: Director[]
  clients: { client: Client; students: Student[] }[]
}

export function OrgChart() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [directors, setDirectors] = useState<Director[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClinic, setSelectedClinic] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [expandedClinics, setExpandedClinics] = useState<Set<string>>(new Set())
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchOrgData()
  }, [])

  const fetchWithRetry = async (url: string, retries = 3, delay = 2000): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      const response = await fetch(url)

      // Check for rate limiting
      if (response.status === 429) {
        console.log(`[v0] Rate limited on ${url}, retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2 // Exponential backoff
        continue
      }

      // Check if response is "Too Many Requests" text
      const contentType = response.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        const text = await response.text()
        if (text.startsWith("Too Many R")) {
          console.log(`[v0] Rate limited (text) on ${url}, retrying in ${delay}ms...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          delay *= 2
          continue
        }
        throw new Error(`Unexpected response: ${text}`)
      }

      return response
    }
    throw new Error(`Failed after ${retries} retries`)
  }

  const fetchOrgData = async () => {
    setLoading(true)
    try {
      const response = await fetchWithRetry("/api/org-chart")
      if (!response.ok) {
        throw new Error("Failed to fetch org chart data")
      }
      const data = await response.json()

      console.log("[v0] Fetched clinics:", data.clinics?.length)
      console.log("[v0] Fetched directors:", data.directors?.length)
      console.log("[v0] Fetched students:", data.students?.length)
      console.log("[v0] Fetched clients:", data.clients?.length)

      setClinics(data.clinics || [])
      setDirectors(data.directors || [])
      setStudents(data.students || [])
      setClients(data.clients || [])

      // Expand all clinics by default
      setExpandedClinics(new Set((data.clinics || []).map((c: Clinic) => c.id)))
    } catch (error) {
      console.error("[v0] Error fetching org data:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleClinic = (clinicId: string) => {
    setExpandedClinics((prev) => {
      const next = new Set(prev)
      if (next.has(clinicId)) {
        next.delete(clinicId)
      } else {
        next.add(clinicId)
      }
      return next
    })
  }

  const toggleClient = (clientId: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev)
      if (next.has(clientId)) {
        next.delete(clientId)
      } else {
        next.add(clientId)
      }
      return next
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Build clinic data with directors, clients, and students
  const getClinicData = (clinic: Clinic): ClinicData => {
    const clinicDirectors = directors.filter((d) => d.clinic_id === clinic.id)
    const clinicStudents = students.filter((s) => s.clinic_id === clinic.id)

    // Get unique client IDs from students in this clinic
    const clientIds = [...new Set(clinicStudents.filter((s) => s.client_id).map((s) => s.client_id))]

    // Build client teams
    const clientTeams = clientIds
      .map((clientId) => {
        const client = clients.find((c) => c.id === clientId)
        if (!client) return null
        const teamStudents = clinicStudents.filter((s) => s.client_id === clientId)
        return { client, students: teamStudents }
      })
      .filter((ct): ct is { client: Client; students: Student[] } => ct !== null)
      .sort((a, b) => a.client.name.localeCompare(b.client.name))

    return {
      clinic,
      directors: clinicDirectors,
      clients: clientTeams,
    }
  }

  // Filter clinics based on selection
  const filteredClinics =
    selectedClinic === "all"
      ? clinics.filter((c) => c.name !== "Internal")
      : clinics.filter((c) => c.id === selectedClinic)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            SEED Organizational Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            SEED Organizational Chart
          </CardTitle>
          <Select value={selectedClinic} onValueChange={setSelectedClinic}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Clinic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clinics</SelectItem>
              {clinics
                .filter((c) => c.name !== "Internal")
                .map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SEED Program Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-primary text-primary-foreground rounded-lg px-6 py-3 shadow-md">
            <h2 className="text-lg font-semibold">SEED Program</h2>
          </div>
          <div className="w-px h-6 bg-border" />
        </div>

        {/* Clinics */}
        <div className="grid gap-4">
          {filteredClinics.map((clinic) => {
            const clinicData = getClinicData(clinic)
            const totalStudents = students.filter((s) => s.clinic_id === clinic.id).length

            return (
              <div key={clinic.id} className="border rounded-lg overflow-hidden">
                {/* Clinic Header */}
                <Collapsible open={expandedClinics.has(clinic.id)} onOpenChange={() => toggleClinic(clinic.id)}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold">{clinic.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {clinicData.directors.length} Director{clinicData.directors.length !== 1 ? "s" : ""} •{" "}
                            {totalStudents} Student{totalStudents !== 1 ? "s" : ""} • {clinicData.clients.length} Client
                            {clinicData.clients.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{totalStudents} students</Badge>
                        {expandedClinics.has(clinic.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 space-y-6">
                      {/* Directors Section */}
                      {clinicData.directors.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wide">
                            <UserCircle className="h-4 w-4" />
                            Clinic Directors
                          </h4>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {clinicData.directors.map((director) => (
                              <div
                                key={director.id}
                                className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800"
                              >
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-12 w-12 border-2 border-blue-300">
                                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                                      {getInitials(director.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm">{director.full_name}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                      {director.job_title || "Clinic Director"}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700 space-y-1">
                                  <a
                                    href={`mailto:${director.email}`}
                                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-blue-600 transition-colors"
                                  >
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate">{director.email}</span>
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Client Teams Section */}
                      {clinicData.clients.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wide">
                            <Briefcase className="h-4 w-4" />
                            Client Teams
                          </h4>
                          <div className="space-y-3">
                            {clinicData.clients.map(({ client, students: teamStudents }) => {
                              const teamLeader = teamStudents.find((s) => s.is_team_leader)

                              return (
                                <Collapsible
                                  key={client.id}
                                  open={expandedClients.has(client.id)}
                                  onOpenChange={() => toggleClient(client.id)}
                                >
                                  <CollapsibleTrigger className="w-full">
                                    <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded">
                                          <Briefcase className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                                        </div>
                                        <div className="text-left">
                                          <p className="font-semibold text-sm">{client.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {teamStudents.length} team member{teamStudents.length !== 1 ? "s" : ""}
                                            {teamLeader && ` • Lead: ${teamLeader.full_name}`}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant={client.status === "active" ? "default" : "secondary"}
                                          className="text-xs"
                                        >
                                          {client.status}
                                        </Badge>
                                        {expandedClients.has(client.id) ? (
                                          <ChevronDown className="h-4 w-4" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4" />
                                        )}
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="ml-4 mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                      {teamStudents
                                        .sort((a, b) => (b.is_team_leader ? 1 : 0) - (a.is_team_leader ? 1 : 0))
                                        .map((student) => (
                                          <div
                                            key={student.id}
                                            className={`p-4 rounded-lg border ${
                                              student.is_team_leader
                                                ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                                                : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
                                            }`}
                                          >
                                            <div className="flex items-start gap-3">
                                              <Avatar className="h-10 w-10">
                                                <AvatarFallback
                                                  className={`font-semibold text-xs ${
                                                    student.is_team_leader
                                                      ? "bg-green-100 text-green-700"
                                                      : "bg-slate-100 text-slate-700"
                                                  }`}
                                                >
                                                  {getInitials(student.full_name)}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                  <p className="font-semibold text-sm truncate">{student.full_name}</p>
                                                  {student.is_team_leader && (
                                                    <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                                  )}
                                                </div>
                                                <p
                                                  className={`text-xs font-medium ${
                                                    student.is_team_leader
                                                      ? "text-green-600 dark:text-green-400"
                                                      : "text-muted-foreground"
                                                  }`}
                                                >
                                                  {student.is_team_leader ? "Team Leader" : "Team Member"}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                                              <a
                                                href={`mailto:${student.email}`}
                                                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                                              >
                                                <Mail className="h-3 w-3" />
                                                <span className="truncate">{student.email}</span>
                                              </a>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Empty State */}
                      {clinicData.directors.length === 0 && clinicData.clients.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          No directors or client teams assigned to this clinic.
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )
          })}
        </div>

        {/* Internal Team Section */}
        {selectedClinic === "all" && (
          <div className="mt-6">
            {clinics
              .filter((c) => c.name === "Internal")
              .map((clinic) => {
                const internalDirectors = directors.filter((d) => d.clinic_id === clinic.id)

                if (internalDirectors.length === 0) return null

                return (
                  <div
                    key={clinic.id}
                    className="border rounded-lg overflow-hidden border-purple-200 dark:border-purple-800"
                  >
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/30">
                      <h3 className="font-semibold flex items-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                          <Building2 className="h-4 w-4 text-purple-700 dark:text-purple-300" />
                        </div>
                        SEED Internal Team
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {internalDirectors.map((director) => (
                          <div
                            key={director.id}
                            className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800"
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-12 w-12 border-2 border-purple-300">
                                <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                                  {getInitials(director.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">{director.full_name}</p>
                                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                  {director.job_title || "SEED Staff"}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700">
                              <a
                                href={`mailto:${director.email}`}
                                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-purple-600 transition-colors"
                              >
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{director.email}</span>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
