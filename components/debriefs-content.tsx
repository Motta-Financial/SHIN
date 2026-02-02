"use client"

import { useState, useEffect, useMemo } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  User,
  Building2,
  Briefcase,
  Calendar,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface Debrief {
  id: string
  student_id: string
  student_email: string
  client_name: string
  clinic: string
  hours_worked: string
  work_summary: string
  questions: string | null
  week_ending: string
  date_submitted: string
  status: string
  week_number: number
  client_id: string
  clinic_id: string
  semester_id: string
}

interface FilterState {
  search: string
  student: string
  client: string
  clinic: string
  week: string
  status: string
}

export function DebriefsContent() {
  const [debriefs, setDebriefs] = useState<Debrief[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    student: "all",
    client: "all",
    clinic: "all",
    week: "all",
    status: "all",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedDebrief, setSelectedDebrief] = useState<Debrief | null>(null)
  const itemsPerPage = 15

  // Fetch debriefs
  useEffect(() => {
    async function fetchDebriefs() {
      try {
        // Use includeAll=true to get all debriefs for directors
        const response = await fetch(`/api/supabase/debriefs?includeAll=true`)
        const data = await response.json()
        console.log("[v0] DebriefsContent - Fetched debriefs:", data.debriefs?.length || 0)
        if (data.debriefs) {
          // Map to expected format
          const mappedDebriefs = data.debriefs.map((d: any) => ({
            id: d.id,
            student_id: d.studentId || d.student_id,
            student_email: d.studentEmail || d.student_email,
            client_name: d.clientName || d.client_name,
            clinic: d.clinic,
            hours_worked: String(d.hoursWorked || d.hours_worked || 0),
            work_summary: d.workSummary || d.work_summary,
            questions: d.questions,
            week_ending: d.weekEnding || d.week_ending,
            date_submitted: d.createdAt || d.created_at,
            status: d.status,
            week_number: d.weekNumber || d.week_number,
            client_id: d.clientId || d.client_id,
            clinic_id: d.clinicId || d.clinic_id,
            semester_id: d.semesterId || d.semester_id,
          }))
          setDebriefs(mappedDebriefs)
        }
      } catch (error) {
        console.error("Error fetching debriefs:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDebriefs()
  }, [])

  // Extract unique filter options from debriefs
  const filterOptions = useMemo(() => {
    const students = [...new Set(debriefs.map((d) => d.student_email))].sort()
    const clients = [...new Set(debriefs.map((d) => d.client_name))].filter(Boolean).sort()
    const clinics = [...new Set(debriefs.map((d) => d.clinic))].filter(Boolean).sort()
    const weeks = [...new Set(debriefs.map((d) => d.week_number))].sort((a, b) => a - b)
    const statuses = [...new Set(debriefs.map((d) => d.status))].filter(Boolean).sort()

    return { students, clients, clinics, weeks, statuses }
  }, [debriefs])

  // Filter debriefs
  const filteredDebriefs = useMemo(() => {
    return debriefs.filter((debrief) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch =
          debrief.student_email?.toLowerCase().includes(searchLower) ||
          debrief.client_name?.toLowerCase().includes(searchLower) ||
          debrief.clinic?.toLowerCase().includes(searchLower) ||
          debrief.work_summary?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Student filter
      if (filters.student !== "all" && debrief.student_email !== filters.student) {
        return false
      }

      // Client filter
      if (filters.client !== "all" && debrief.client_name !== filters.client) {
        return false
      }

      // Clinic filter
      if (filters.clinic !== "all" && debrief.clinic !== filters.clinic) {
        return false
      }

      // Week filter
      if (filters.week !== "all" && debrief.week_number !== Number.parseInt(filters.week)) {
        return false
      }

      // Status filter
      if (filters.status !== "all" && debrief.status !== filters.status) {
        return false
      }

      return true
    })
  }, [debriefs, filters])

  // Pagination
  const totalPages = Math.ceil(filteredDebriefs.length / itemsPerPage)
  const paginatedDebriefs = filteredDebriefs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const clearFilters = () => {
    setFilters({
      search: "",
      student: "all",
      client: "all",
      clinic: "all",
      week: "all",
      status: "all",
    })
  }

  const hasActiveFilters =
    filters.search ||
    filters.student !== "all" ||
    filters.client !== "all" ||
    filters.clinic !== "all" ||
    filters.week !== "all" ||
    filters.status !== "all"

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStudentName = (email: string) => {
    if (!email) return "-"
    const namePart = email.split("@")[0]
    return namePart
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Side Navigation */}
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>

      {/* Main Content */}
      <main className="flex-1 pl-52 pt-14">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Debriefs Bank</h1>
              <p className="text-muted-foreground text-sm mt-1">
                View and filter all student debriefs across clients, clinics, and weeks
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {filteredDebriefs.length} debrief{filteredDebriefs.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>

          {/* Filters Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Filters</CardTitle>
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                    <X className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                {/* Search */}
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search debriefs..."
                      value={filters.search}
                      onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                      className="pl-8 h-9"
                    />
                  </div>
                </div>

                {/* Student Filter */}
                <Select
                  value={filters.student}
                  onValueChange={(value) => setFilters((f) => ({ ...f, student: value }))}
                >
                  <SelectTrigger className="h-9">
                    <User className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Student" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {filterOptions.students.map((student) => (
                      <SelectItem key={student} value={student}>
                        {getStudentName(student)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Client Filter */}
                <Select value={filters.client} onValueChange={(value) => setFilters((f) => ({ ...f, client: value }))}>
                  <SelectTrigger className="h-9">
                    <Briefcase className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {filterOptions.clients.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clinic Filter */}
                <Select value={filters.clinic} onValueChange={(value) => setFilters((f) => ({ ...f, clinic: value }))}>
                  <SelectTrigger className="h-9">
                    <Building2 className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clinics</SelectItem>
                    {filterOptions.clinics.map((clinic) => (
                      <SelectItem key={clinic} value={clinic}>
                        {clinic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Week Filter */}
                <Select value={filters.week} onValueChange={(value) => setFilters((f) => ({ ...f, week: value }))}>
                  <SelectTrigger className="h-9">
                    <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Week" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Weeks</SelectItem>
                    {filterOptions.weeks.map((week) => (
                      <SelectItem key={week} value={week.toString()}>
                        Week {week}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Debriefs Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredDebriefs.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <h3 className="font-medium text-lg">No debriefs found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hasActiveFilters
                      ? "Try adjusting your filters to see more results"
                      : "No debriefs have been submitted yet"}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 bg-transparent">
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[180px]">Student</TableHead>
                        <TableHead className="w-[180px]">Client</TableHead>
                        <TableHead className="w-[120px]">Clinic</TableHead>
                        <TableHead className="w-[80px] text-center">Week</TableHead>
                        <TableHead className="w-[80px] text-center">Hours</TableHead>
                        <TableHead className="w-[100px]">Submitted</TableHead>
                        <TableHead>Work Summary</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDebriefs.map((debrief) => (
                        <TableRow key={debrief.id} className="group">
                          <TableCell className="font-medium">{getStudentName(debrief.student_email)}</TableCell>
                          <TableCell className="text-muted-foreground">{debrief.client_name || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-normal">
                              {debrief.clinic || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-medium">{debrief.week_number}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm">
                              {Number.parseFloat(debrief.hours_worked || "0").toFixed(1)}h
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(debrief.date_submitted)}
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            <p className="text-sm text-muted-foreground line-clamp-2">{debrief.work_summary || "-"}</p>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedDebrief(debrief)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                        {Math.min(currentPage * itemsPerPage, filteredDebriefs.length)} of {filteredDebriefs.length}{" "}
                        debriefs
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Detail Modal */}
          {selectedDebrief && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Debrief Details</CardTitle>
                    <CardDescription>
                      Week {selectedDebrief.week_number} - {getStudentName(selectedDebrief.student_email)}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedDebrief(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Student</p>
                      <p className="font-medium">{getStudentName(selectedDebrief.student_email)}</p>
                      <p className="text-sm text-muted-foreground">{selectedDebrief.student_email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Client</p>
                      <p className="font-medium">{selectedDebrief.client_name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Clinic</p>
                      <p className="font-medium">{selectedDebrief.clinic || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Hours Worked</p>
                      <p className="font-medium">
                        {Number.parseFloat(selectedDebrief.hours_worked || "0").toFixed(1)} hours
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Week Ending</p>
                      <p className="font-medium">{formatDate(selectedDebrief.week_ending)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Date Submitted</p>
                      <p className="font-medium">{formatDate(selectedDebrief.date_submitted)}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Work Summary</p>
                    <p className="text-sm leading-relaxed">{selectedDebrief.work_summary || "No summary provided"}</p>
                  </div>
                  {selectedDebrief.questions && (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Questions</p>
                      <p className="text-sm leading-relaxed">{selectedDebrief.questions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
