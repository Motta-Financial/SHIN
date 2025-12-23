"use client"

import { Suspense, useState, useEffect } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { ClinicPerformance } from "@/components/clinic-performance"
import { WeeklyProgramSummary } from "@/components/weekly-program-summary"
import { DirectorNotifications } from "@/components/director-notifications"
import { AgendaWidget } from "@/components/agenda-widget"
import { ClinicView } from "@/components/clinic-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  RefreshCw,
  BarChart3,
  FileText,
  Users,
  Clock,
  Briefcase,
  TrendingUp,
  Calendar,
  Download,
  ChevronDown,
  AlertCircle,
  Building2,
  Activity,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface QuickStats {
  totalHours: number
  activeStudents: number
  activeClients: number
  debriefsSubmitted: number
  pendingReviews: number
  hoursChange: number
  studentsChange: number
}

interface WeekSchedule {
  value: string
  label: string
  weekNumber: number
  isBreak: boolean
  weekStart: string
  weekEnd: string
}

async function getAvailableWeeks(): Promise<{ weeks: string[]; schedule: WeekSchedule[] }> {
  try {
    const response = await fetch("/api/supabase/weeks")
    const data = await response.json()
    if (data.success && data.weeks) {
      return { weeks: data.weeks, schedule: data.schedule || [] }
    }
    return { weeks: [], schedule: [] }
  } catch (error) {
    console.error("Error fetching available weeks:", error)
    return { weeks: [], schedule: [] }
  }
}

async function getQuickStats(selectedWeeks: string[], selectedClinic: string): Promise<QuickStats> {
  try {
    const [debriefsRes, rosterRes, directorsRes] = await Promise.all([
      fetch("/api/supabase/debriefs"),
      fetch("/api/supabase/roster"),
      fetch("/api/directors"),
    ])

    const debriefsData = await debriefsRes.json()
    const rosterData = await rosterRes.json()
    const directorsData = await directorsRes.json()

    const directorToClinicMap = new Map<string, string>()
    if (directorsData.directors) {
      directorsData.directors.forEach((d: { full_name: string; clinic: string }) => {
        directorToClinicMap.set(d.full_name, d.clinic)
      })
    }

    const filterClinic = selectedClinic === "all" ? null : directorToClinicMap.get(selectedClinic)

    let totalHours = 0
    const activeStudents = new Set<string>()
    const activeClients = new Set<string>()
    let debriefsSubmitted = 0

    debriefsData.records?.forEach((record: any) => {
      const fields = record.fields
      const weekEnding = fields.week_ending
      const clinic = fields.clinic
      const clientName = fields.client_name
      const hours = Number.parseFloat(fields.total_hours || "0")
      const studentCount = Number.parseInt(fields.student_count || "0")

      const matchesWeek = selectedWeeks.includes(weekEnding)
      const matchesClinic = !filterClinic || clinic === filterClinic

      if (matchesWeek && matchesClinic) {
        totalHours += hours
        if (clientName) activeClients.add(clientName)
        debriefsSubmitted++
        for (let i = 0; i < studentCount; i++) {
          activeStudents.add(`${clientName}-student-${i}`)
        }
      }
    })

    let rosterStudentCount = 0
    rosterData.records?.forEach((record: any) => {
      const clinic = record.fields["Clinic"]
      const role = record.fields["Role"]
      if (role === "Student" && (!filterClinic || clinic === filterClinic)) {
        rosterStudentCount++
      }
    })

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      activeStudents: rosterStudentCount || activeStudents.size,
      activeClients: activeClients.size,
      debriefsSubmitted,
      pendingReviews: 0,
      hoursChange: 12.5,
      studentsChange: 8.2,
    }
  } catch (error) {
    console.error("Error fetching quick stats:", error)
    return {
      totalHours: 0,
      activeStudents: 0,
      activeClients: 0,
      debriefsSubmitted: 0,
      pendingReviews: 0,
      hoursChange: 0,
      studentsChange: 0,
    }
  }
}

export default function DirectorDashboardPage() {
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule[]>([])
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([])
  const [selectedClinic, setSelectedClinic] = useState<string>("all")
  const [showDashboards, setShowDashboards] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<"performance" | "summary" | "clinic">("performance")
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalHours: 0,
    activeStudents: 0,
    activeClients: 0,
    debriefsSubmitted: 0,
    pendingReviews: 0,
    hoursChange: 0,
    studentsChange: 0,
  })
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    getAvailableWeeks().then(({ weeks, schedule }) => {
      setAvailableWeeks(weeks)
      setWeekSchedule(schedule)
    })
  }, [])

  const handleGenerateSummaries = async () => {
    setIsGenerating(true)
    setStatsLoading(true)

    const stats = await getQuickStats(selectedWeeks, selectedClinic)
    setQuickStats(stats)
    setStatsLoading(false)

    setTimeout(() => setIsGenerating(false), 500)
  }

  const handleReset = () => {
    setShowDashboards(false)
    setQuickStats({
      totalHours: 0,
      activeStudents: 0,
      activeClients: 0,
      debriefsSubmitted: 0,
      pendingReviews: 0,
      hoursChange: 0,
      studentsChange: 0,
    })
  }

  const formatDateRange = () => {
    if (selectedWeeks.length === 0) return "No dates selected"
    if (selectedWeeks.length === 1) {
      return new Date(selectedWeeks[0]).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    }
    const sorted = [...selectedWeeks].sort()
    const first = new Date(sorted[0]).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const last = new Date(sorted[sorted.length - 1]).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    return `${first} - ${last}`
  }

  const handleExport = (format: "pdf" | "csv" | "excel") => {
    alert(`Export as ${format.toUpperCase()} coming soon!`)
  }

  return (
    <div className="min-h-screen bg-background pt-[48px] pl-12">
      <MainNavigation />

      <DashboardHeader
        selectedWeeks={selectedWeeks}
        onWeeksChange={setSelectedWeeks}
        availableWeeks={availableWeeks}
        selectedClinic={selectedClinic}
        onClinicChange={setSelectedClinic}
      />

      <main className="container mx-auto px-6 py-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Director Dashboard</h1>
              {selectedClinic !== "all" && (
                <Badge variant="secondary" className="text-xs font-medium">
                  {selectedClinic}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              {formatDateRange()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {showDashboards && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-9 bg-transparent">
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Export</span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => handleExport("pdf")}>Export as PDF</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("csv")}>Export as CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("excel")}>Export as Excel</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="sm" onClick={handleReset} className="gap-2 h-9 bg-transparent">
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
              </>
            )}

            <Button
              onClick={handleGenerateSummaries}
              disabled={selectedWeeks.length === 0 || isGenerating}
              size="sm"
              className="gap-2 h-9"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Generate Report</span>
                  <span className="sm:hidden">Generate</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Layout for main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main content area */}
          <div className="lg:col-span-2">
            {selectedWeeks.length === 0 && (
              <Card className="border-amber-500/20 bg-amber-50">
                <CardContent className="py-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    Select at least one week from the header filters to generate your summary reports.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards */}
            {showDashboards && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card border-border hover:border-muted-foreground/20 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Hours</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : quickStats.totalHours.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                      <span className="text-xs text-emerald-500">+{quickStats.hoursChange}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border hover:border-muted-foreground/20 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : quickStats.activeStudents}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                      <span className="text-xs text-emerald-500">+{quickStats.studentsChange}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border hover:border-muted-foreground/20 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Clients</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : quickStats.activeClients}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Active this period</p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border hover:border-muted-foreground/20 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Summaries</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : quickStats.debriefsSubmitted}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Weekly reports</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Content - Tabbed Dashboards */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "performance" | "summary" | "clinic")}>
              <div className="flex items-center justify-between">
                <TabsList className="bg-secondary/50 p-1">
                  <TabsTrigger
                    value="performance"
                    className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Clinic Performance</span>
                    <span className="sm:hidden">Performance</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="summary"
                    className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Weekly Summary</span>
                    <span className="sm:hidden">Summary</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="clinic"
                    className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Building2 className="h-4 w-4" />
                    <span className="hidden sm:inline">My Clinic</span>
                    <span className="sm:hidden">Clinic</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="performance" className="space-y-4 mt-0">
                {showDashboards ? (
                  <Suspense fallback={<div className="h-96 bg-card animate-pulse rounded-lg border" />}>
                    <div className="w-full">
                      <ClinicPerformance
                        selectedWeeks={selectedWeeks}
                        selectedClinic={selectedClinic}
                        weekSchedule={weekSchedule}
                      />
                    </div>
                  </Suspense>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Generate Report to View Performance</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Select weeks and click "Generate Report" to view clinic performance metrics.
                      </p>
                      <Button onClick={handleGenerateSummaries} disabled={selectedWeeks.length === 0}>
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="summary" className="mt-6">
                {showDashboards ? (
                  <Suspense fallback={<div className="h-96 bg-card animate-pulse rounded-lg border" />}>
                    <div className="w-full">
                      <WeeklyProgramSummary selectedWeek={selectedWeeks[0]} selectedClinic={selectedClinic} />
                    </div>
                  </Suspense>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Generate Report to View Summary</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Select weeks and click "Generate Report" to view weekly summaries.
                      </p>
                      <Button onClick={handleGenerateSummaries} disabled={selectedWeeks.length === 0}>
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="clinic" className="mt-6">
                <ClinicView selectedClinic={selectedClinic} selectedWeeks={selectedWeeks} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            {selectedWeeks.length > 0 && (
              <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}>
                <AgendaWidget selectedClinic={selectedClinic} selectedWeeks={selectedWeeks} compact />
              </Suspense>
            )}
            <Suspense fallback={null}>
              <DirectorNotifications selectedClinic={selectedClinic} compact />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}
