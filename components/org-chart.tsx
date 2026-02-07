"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Mail,
  Briefcase,
  Crown,
  UserCircle,
  Users,
  Phone,
} from "lucide-react"

interface Director {
  id: string
  full_name: string
  email: string
  job_title: string | null
  role: string | null
  phone: string | null
  clinic_id: string | null
}

interface Student {
  id: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
  is_team_leader: boolean
  client_id: string | null
  clinic_id: string | null
  academic_level: string | null
}

interface Client {
  id: string
  name: string
  contact_name: string | null
  email: string | null
  status: string
  project_type: string | null
}

interface Clinic {
  id: string
  name: string
}

// Junction table types
interface ClinicDirectorJunction {
  clinic_id: string
  director_id: string
  role: string | null
}

interface ClinicStudentJunction {
  clinic_id: string
  student_id: string
}

interface ClinicClientJunction {
  clinic_id: string
  client_id: string
}

interface ClientAssignment {
  client_id: string
  student_id: string
  role: string | null
}

interface ClinicRosterData {
  clinic: Clinic
  directors: (Director & { junctionRole?: string | null })[]
  clients: { client: Client; students: (Student & { assignmentRole?: string | null })[] }[]
  unassignedStudents: Student[]
}

export function OrgChart() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [directors, setDirectors] = useState<Director[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [clinicDirectors, setClinicDirectors] = useState<ClinicDirectorJunction[]>([])
  const [clinicStudents, setClinicStudents] = useState<ClinicStudentJunction[]>([])
  const [clinicClients, setClinicClients] = useState<ClinicClientJunction[]>([])
  const [clientAssignments, setClientAssignments] = useState<ClientAssignment[]>([])
  const [selectedClinic, setSelectedClinic] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedClinics, setExpandedClinics] = useState<Set<string>>(new Set())
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchOrgData()
  }, [])

  const fetchOrgData = async () => {
    setLoading(true)
    setError(null)
    try {
      const { fetchWithRateLimit } = await import("@/lib/fetch-with-rate-limit")
      const response = await fetchWithRateLimit("/api/org-chart")
      if (!response.ok) {
        throw new Error("Failed to fetch org chart data")
      }
      const data = await response.json()

      setClinics(data.clinics || [])
      setDirectors(data.directors || [])
      setStudents(data.students || [])
      setClients(data.clients || [])
      setClinicDirectors(data.clinicDirectors || [])
      setClinicStudents(data.clinicStudents || [])
      setClinicClients(data.clinicClients || [])
      setClientAssignments(data.clientAssignments || [])

      // Expand all clinics by default
      setExpandedClinics(new Set((data.clinics || []).map((c: Clinic) => c.id)))
    } catch (err) {
      console.error("[v0] Error fetching org data:", err)
      setError(err instanceof Error ? err.message : "Failed to load org chart data")
    } finally {
      setLoading(false)
    }
  }

  const toggleClinic = (clinicId: string) => {
    setExpandedClinics((prev) => {
      const next = new Set(prev)
      if (next.has(clinicId)) next.delete(clinicId)
      else next.add(clinicId)
      return next
    })
  }

  const toggleClient = (clientId: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev)
      if (next.has(clientId)) next.delete(clientId)
      else next.add(clientId)
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

  // Build clinic data using junction tables (with fallback to direct FK)
  const getClinicData = (clinic: Clinic): ClinicRosterData => {
    const useJunctions = clinicDirectors.length > 0 || clinicStudents.length > 0 || clinicClients.length > 0

    // Directors for this clinic
    let clinicDirs: (Director & { junctionRole?: string | null })[]
    if (useJunctions) {
      const junctions = clinicDirectors.filter((cd) => cd.clinic_id === clinic.id)
      clinicDirs = junctions
        .map((j) => {
          const dir = directors.find((d) => d.id === j.director_id)
          return dir ? { ...dir, junctionRole: j.role } : null
        })
        .filter((d): d is Director & { junctionRole?: string | null } => d !== null)
    } else {
      clinicDirs = directors.filter((d) => d.clinic_id === clinic.id)
    }

    // Students in this clinic
    let clinicStudentList: Student[]
    if (useJunctions && clinicStudents.length > 0) {
      const studentJunctions = clinicStudents.filter((cs) => cs.clinic_id === clinic.id)
      clinicStudentList = studentJunctions
        .map((j) => students.find((s) => s.id === j.student_id))
        .filter((s): s is Student => s !== null)
    } else {
      clinicStudentList = students.filter((s) => s.clinic_id === clinic.id)
    }

    // Clients in this clinic
    let clinicClientList: Client[]
    if (useJunctions && clinicClients.length > 0) {
      const clientJunctions = clinicClients.filter((cc) => cc.clinic_id === clinic.id)
      clinicClientList = clientJunctions
        .map((j) => clients.find((c) => c.id === j.client_id))
        .filter((c): c is Client => c !== null)
    } else {
      // Fallback: get unique client IDs from students assigned to this clinic
      const clientIds = [...new Set(clinicStudentList.filter((s) => s.client_id).map((s) => s.client_id!))]
      clinicClientList = clientIds.map((cid) => clients.find((c) => c.id === cid)).filter((c): c is Client => c !== null)
    }

    // Build client teams with student assignments
    const assignedStudentIds = new Set<string>()
    const clientTeams = clinicClientList
      .map((client) => {
        let teamStudents: (Student & { assignmentRole?: string | null })[]

        if (clientAssignments.length > 0) {
          // Use client_assignments junction
          const assignments = clientAssignments.filter((ca) => ca.client_id === client.id)
          teamStudents = assignments
            .map((a) => {
              const student = clinicStudentList.find((s) => s.id === a.student_id)
              return student ? { ...student, assignmentRole: a.role } : null
            })
            .filter((s): s is Student & { assignmentRole?: string | null } => s !== null)
        } else {
          // Fallback: use direct client_id FK on students
          teamStudents = clinicStudentList.filter((s) => s.client_id === client.id)
        }

        for (const s of teamStudents) assignedStudentIds.add(s.id)
        return { client, students: teamStudents }
      })
      .sort((a, b) => a.client.name.localeCompare(b.client.name))

    // Students in this clinic who aren't assigned to any client
    const unassignedStudents = clinicStudentList.filter((s) => !assignedStudentIds.has(s.id))

    return {
      clinic,
      directors: clinicDirs,
      clients: clientTeams,
      unassignedStudents,
    }
  }

  // Filter clinics based on selection
  const filteredClinics =
    selectedClinic === "all"
      ? clinics.filter((c) => c.name !== "Internal")
      : clinics.filter((c) => c.id === selectedClinic)

  // Summary stats
  const totalDirectors = directors.length
  const totalStudents = students.length
  const totalClients = clients.length
  const totalClinics = clinics.filter((c) => c.name !== "Internal").length

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
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">Loading roster data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            SEED Organizational Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <span className="text-destructive text-xl font-bold">!</span>
            </div>
            <h3 className="font-semibold text-lg mb-1">Error Loading Data</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              type="button"
              onClick={() => fetchOrgData()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalClinics}</p>
              <p className="text-xs text-muted-foreground">Clinics</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/50 rounded-lg">
              <UserCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalDirectors}</p>
              <p className="text-xs text-muted-foreground">Directors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 rounded-lg">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs text-muted-foreground">Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-950/50 rounded-lg">
              <Briefcase className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalClients}</p>
              <p className="text-xs text-muted-foreground">Clients</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Org Chart Card */}
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
          <div className="flex flex-col items-center mb-4">
            <div className="bg-primary text-primary-foreground rounded-lg px-6 py-3 shadow-md">
              <h2 className="text-lg font-semibold">SEED Program</h2>
            </div>
            <div className="w-px h-6 bg-border" />
          </div>

          {/* Clinics */}
          <div className="grid gap-4">
            {filteredClinics.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No clinics found</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {clinics.length === 0
                    ? "No clinic data is available yet."
                    : "Try changing the clinic filter above."}
                </p>
              </div>
            )}
            {filteredClinics.map((clinic) => {
              const clinicData = getClinicData(clinic)
              const clinicStudentCount =
                clinicData.clients.reduce((acc, ct) => acc + ct.students.length, 0) +
                clinicData.unassignedStudents.length

              return (
                <div key={clinic.id} className="border rounded-lg overflow-hidden">
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
                              {clinicData.directors.length} Director{clinicData.directors.length !== 1 ? "s" : ""} /{" "}
                              {clinicStudentCount} Student{clinicStudentCount !== 1 ? "s" : ""} /{" "}
                              {clinicData.clients.length} Client{clinicData.clients.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{clinicStudentCount} students</Badge>
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
                                        {director.junctionRole || director.job_title || director.role || "Clinic Director"}
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
                                    {director.phone && (
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Phone className="h-3 w-3" />
                                        <span>{director.phone}</span>
                                      </div>
                                    )}
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
                                              {teamLeader && ` / Lead: ${teamLeader.full_name}`}
                                              {client.project_type && ` / ${client.project_type}`}
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
                                                    <p className="font-semibold text-sm truncate">
                                                      {student.full_name}
                                                    </p>
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
                                                    {student.is_team_leader
                                                      ? "Team Leader"
                                                      : student.assignmentRole || "Team Member"}
                                                  </p>
                                                  {student.academic_level && (
                                                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                                                      {student.academic_level}
                                                    </p>
                                                  )}
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
                                        {teamStudents.length === 0 && (
                                          <p className="text-xs text-muted-foreground py-2 col-span-full">
                                            No students assigned to this client yet.
                                          </p>
                                        )}
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Unassigned Students */}
                        {clinicData.unassignedStudents.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wide">
                              <Users className="h-4 w-4" />
                              Unassigned Students
                            </h4>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {clinicData.unassignedStudents.map((student) => (
                                <div
                                  key={student.id}
                                  className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-600"
                                >
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                      <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-semibold">
                                        {getInitials(student.full_name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{student.full_name}</p>
                                      <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Empty State */}
                        {clinicData.directors.length === 0 &&
                          clinicData.clients.length === 0 &&
                          clinicData.unassignedStudents.length === 0 && (
                            <p className="text-center text-muted-foreground py-4">
                              No directors, clients, or students assigned to this clinic yet.
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
                  const clinicData = getClinicData(clinic)
                  if (clinicData.directors.length === 0) return null

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
                          {clinicData.directors.map((director) => (
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
                                    {director.junctionRole || director.job_title || director.role || "Internal Director"}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700 space-y-1">
                                <a
                                  href={`mailto:${director.email}`}
                                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-purple-600 transition-colors"
                                >
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate">{director.email}</span>
                                </a>
                                {director.phone && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    <span>{director.phone}</span>
                                  </div>
                                )}
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
    </div>
  )
}
