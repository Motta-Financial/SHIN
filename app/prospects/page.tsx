"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Calendar,
  CheckCircle,
  User,
  Mail,
  Phone,
  Building,
  Users,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  FileText,
  Briefcase,
  TrendingUp,
  UserCheck,
  UserX,
  CalendarCheck,
  MessageSquare,
  ExternalLink,
} from "lucide-react"
import { MainNavigation } from "@/components/main-navigation"

interface Prospect {
  id: string
  name: string
  email: string | null
  phone: string | null
  categories: string | null
  student_status: string | null
  major: string | null
  interviewer_id: string | null
  interviewer_name: string | null
  director_in_charge_id: string | null
  director_in_charge_name: string | null
  interview_status: string | null
  interview_schedule: string | null
  interview_time: string | null
  interview_link: string | null
  clinic_of_interest_id: string | null
  clinic_of_interest: string | null
  suggested_clinic_id: string | null
  suggested_clinic: string | null
  acceptance_status: string | null
  is_pre_seed: boolean
  notes: string | null
  target_semester_id: string | null
  created_at: string
}

interface ProspectInterview {
  id: string
  prospect_id: string | null
  prospect_name: string | null
  prospect_email: string | null
  interviewer_id: string | null
  interviewer_name: string | null
  interview_date: string | null
  interview_status: string | null
  acceptance_status: string | null
  is_pre_seed: boolean
  meeting_notes: string | null
  clinic_of_interest: string | null
  suggested_clinic: string | null
  created_at: string
}

interface Director {
  id: string
  full_name: string
  clinic_id: string | null
}

function ProspectsContent() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [interviews, setInterviews] = useState<ProspectInterview[]>([])
  const [directors, setDirectors] = useState<Director[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDirector, setSelectedDirector] = useState<string>("all")
  const [selectedClinic, setSelectedClinic] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [expandedInterviews, setExpandedInterviews] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [])

  const fetchWithRetry = async (url: string, retries = 3, delay = 2000): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      const response = await fetch(url)
      if (response.status === 429) {
        await new Promise((r) => setTimeout(r, delay))
        delay *= 2
        continue
      }
      const ct = response.headers.get("content-type")
      if (!ct?.includes("application/json")) {
        const text = await response.text()
        if (text.includes("Too Many R")) {
          await new Promise((r) => setTimeout(r, delay))
          delay *= 2
          continue
        }
      }
      return response
    }
    throw new Error(`Failed after ${retries} retries for ${url}`)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // Stagger requests to avoid rate limiting
      const prospectsRes = await fetchWithRetry("/api/prospects")
      await new Promise((r) => setTimeout(r, 300))
      const interviewsRes = await fetchWithRetry("/api/prospect-interviews")
      await new Promise((r) => setTimeout(r, 300))
      const directorsRes = await fetchWithRetry("/api/directors")

      if (!prospectsRes.ok) throw new Error("Failed to fetch prospects")
      if (!interviewsRes.ok) throw new Error("Failed to fetch interviews")
      if (!directorsRes.ok) throw new Error("Failed to fetch directors")

      const [prospectsData, interviewsData, directorsData] = await Promise.all([
        prospectsRes.json(),
        interviewsRes.json(),
        directorsRes.json(),
      ])

      setProspects(prospectsData.data || [])
      setInterviews(interviewsData.data || [])
      setDirectors(directorsData.directors || directorsData.data || [])
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const filteredProspects = useMemo(() => {
    return prospects.filter((prospect) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          prospect.name?.toLowerCase().includes(query) ||
          prospect.email?.toLowerCase().includes(query) ||
          prospect.major?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }
      if (selectedDirector !== "all") {
        if (prospect.interviewer_id !== selectedDirector && prospect.director_in_charge_id !== selectedDirector) {
          return false
        }
      }
      if (selectedClinic !== "all") {
        const clinicMatch =
          prospect.clinic_of_interest?.toLowerCase().includes(selectedClinic.toLowerCase()) ||
          prospect.suggested_clinic?.toLowerCase().includes(selectedClinic.toLowerCase())
        if (!clinicMatch) return false
      }
      if (selectedStatus !== "all") {
        if (prospect.acceptance_status !== selectedStatus) return false
      }
      return true
    })
  }, [prospects, searchQuery, selectedDirector, selectedClinic, selectedStatus])

  const stats = useMemo(() => {
    const total = filteredProspects.length
    const accepted = filteredProspects.filter((p) => p.acceptance_status === "Accepted").length
    const withdrawn = filteredProspects.filter((p) => p.acceptance_status === "Withdrawn").length
    const declined = filteredProspects.filter((p) => p.acceptance_status === "Declined").length
    const preSeed = filteredProspects.filter((p) => p.is_pre_seed).length
    const completed = filteredProspects.filter((p) => p.interview_status === "Complete").length
    const noShow = filteredProspects.filter((p) => p.interview_status === "No Show").length

    const byClinic: Record<string, number> = {}
    filteredProspects.forEach((p) => {
      const clinic = p.suggested_clinic || p.clinic_of_interest || "Unassigned"
      byClinic[clinic] = (byClinic[clinic] || 0) + 1
    })

    return { total, accepted, withdrawn, declined, preSeed, completed, noShow, byClinic }
  }, [filteredProspects])

  const clinics = useMemo(() => {
    const clinicSet = new Set<string>()
    prospects.forEach((p) => {
      if (p.clinic_of_interest) clinicSet.add(p.clinic_of_interest)
      if (p.suggested_clinic) clinicSet.add(p.suggested_clinic)
    })
    return Array.from(clinicSet).sort()
  }, [prospects])

  const filteredInterviews = useMemo(() => {
    if (selectedDirector === "all" && selectedClinic === "all" && selectedStatus === "all" && !searchQuery) {
      return interviews
    }

    return interviews.filter((interview) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          interview.prospect_name?.toLowerCase().includes(query) ||
          interview.prospect_email?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }
      if (selectedDirector !== "all") {
        if (interview.interviewer_id !== selectedDirector) return false
      }
      if (selectedClinic !== "all") {
        const clinicMatch =
          interview.clinic_of_interest?.toLowerCase().includes(selectedClinic.toLowerCase()) ||
          interview.suggested_clinic?.toLowerCase().includes(selectedClinic.toLowerCase())
        if (!clinicMatch) return false
      }
      if (selectedStatus !== "all") {
        if (interview.acceptance_status !== selectedStatus) return false
      }
      return true
    })
  }, [interviews, searchQuery, selectedDirector, selectedClinic, selectedStatus])

  const toggleInterviewExpanded = (id: string) => {
    setExpandedInterviews((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getStatusBadgeColor = (status: string | null) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-800 border-green-200"
      case "Declined":
        return "bg-red-100 text-red-800 border-red-200"
      case "Withdrawn":
        return "bg-slate-100 text-slate-800 border-slate-200"
      default:
        return "bg-amber-100 text-amber-800 border-amber-200"
    }
  }

  const getInterviewStatusBadgeColor = (status: string | null) => {
    switch (status) {
      case "Complete":
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "No Show":
      case "No-Show":
        return "bg-red-100 text-red-800 border-red-200"
      case "Scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-amber-100 text-amber-800 border-amber-200"
    }
  }

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
              <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchData}>Try Again</Button>
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
        <main className="p-6 space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  <GraduationCap className="h-8 w-8" />
                  Spring 2026 Prospect Management
                </h1>
                <p className="text-indigo-100 mt-1">
                  Track interviews, manage candidates, and assign students to clinics
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center bg-white/10 rounded-lg px-4 py-2">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-indigo-200">Total Prospects</p>
                </div>
                <div className="text-center bg-white/10 rounded-lg px-4 py-2">
                  <p className="text-2xl font-bold">{stats.accepted}</p>
                  <p className="text-xs text-indigo-200">Accepted</p>
                </div>
                <div className="text-center bg-white/10 rounded-lg px-4 py-2">
                  <p className="text-2xl font-bold">
                    {stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}%
                  </p>
                  <p className="text-xs text-indigo-200">Accept Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <UserCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-900">{stats.accepted}</p>
                    <p className="text-xs text-green-700">Accepted</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <UserX className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-red-900">{stats.declined + stats.withdrawn}</p>
                    <p className="text-xs text-red-700">Declined/Withdrawn</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <CalendarCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-blue-900">{stats.completed}</p>
                    <p className="text-xs text-blue-700">Interviewed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-amber-900">{stats.noShow}</p>
                    <p className="text-xs text-amber-700">No Shows</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-purple-900">{stats.preSeed}</p>
                    <p className="text-xs text-purple-700">Pre-SEED</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-500/10">
                    <MessageSquare className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900">{filteredInterviews.length}</p>
                    <p className="text-xs text-slate-700">Interview Notes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Clinic Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5" />
                Clinic Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(stats.byClinic)
                  .sort((a, b) => b[1] - a[1])
                  .map(([clinic, count]) => (
                    <div key={clinic} className="text-center">
                      <div className="mb-2">
                        <Progress value={(count / stats.total) * 100} className="h-2" />
                      </div>
                      <p className="font-semibold text-lg">{count}</p>
                      <p className="text-xs text-muted-foreground">{clinic}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, major..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedDirector} onValueChange={setSelectedDirector}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Directors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Directors</SelectItem>
                    {directors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Clinics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clinics</SelectItem>
                    {clinics.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Declined">Declined</SelectItem>
                    <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                    <SelectItem value="Invited">Invited</SelectItem>
                  </SelectContent>
                </Select>
                {(searchQuery ||
                  selectedDirector !== "all" ||
                  selectedClinic !== "all" ||
                  selectedStatus !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedDirector("all")
                      setSelectedClinic("all")
                      setSelectedStatus("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
                <Badge variant="outline" className="ml-auto">
                  {filteredProspects.length} of {prospects.length} prospects
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="prospects" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="prospects" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Prospects ({filteredProspects.length})
              </TabsTrigger>
              <TabsTrigger value="interviews" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Interview Summaries ({filteredInterviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prospects">
              <Card>
                <CardHeader>
                  <CardTitle>All Prospects</CardTitle>
                  <CardDescription>Spring 2026 semester candidates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredProspects.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No prospects found matching your filters
                      </div>
                    ) : (
                      filteredProspects.map((prospect) => (
                        <div
                          key={prospect.id}
                          className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h3 className="font-semibold text-foreground">{prospect.name}</h3>
                                <Badge className={getStatusBadgeColor(prospect.acceptance_status)}>
                                  {prospect.acceptance_status || "Pending"}
                                </Badge>
                                <Badge className={getInterviewStatusBadgeColor(prospect.interview_status)}>
                                  {prospect.interview_status || "Not Scheduled"}
                                </Badge>
                                {prospect.is_pre_seed && (
                                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">Pre-SEED</Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                {prospect.email && (
                                  <a
                                    href={`mailto:${prospect.email}`}
                                    className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                                  >
                                    <Mail className="h-4 w-4" />
                                    <span className="truncate">{prospect.email}</span>
                                  </a>
                                )}
                                {prospect.phone && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    <span>{prospect.phone}</span>
                                  </div>
                                )}
                                {prospect.major && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Briefcase className="h-4 w-4" />
                                    <span className="truncate">{prospect.major}</span>
                                  </div>
                                )}
                                {prospect.interviewer_name && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span>{prospect.interviewer_name}</span>
                                  </div>
                                )}
                                {prospect.interview_schedule && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      {new Date(prospect.interview_schedule).toLocaleDateString()}
                                      {prospect.interview_time && ` at ${prospect.interview_time}`}
                                    </span>
                                  </div>
                                )}
                                {(prospect.suggested_clinic || prospect.clinic_of_interest) && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Building className="h-4 w-4" />
                                    <span>{prospect.suggested_clinic || prospect.clinic_of_interest}</span>
                                  </div>
                                )}
                                {prospect.interview_link && (
                                  <a
                                    href={prospect.interview_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    <span>Join Interview</span>
                                  </a>
                                )}
                              </div>
                              {prospect.notes && (
                                <p className="mt-3 text-sm text-muted-foreground italic border-l-2 border-muted pl-3">
                                  {prospect.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interviews">
              <Card>
                <CardHeader>
                  <CardTitle>Interview Summaries</CardTitle>
                  <CardDescription>Director meeting notes and candidate assessments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredInterviews.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No interview summaries found</div>
                    ) : (
                      filteredInterviews.map((interview) => (
                        <Collapsible
                          key={interview.id}
                          open={expandedInterviews.has(interview.id)}
                          onOpenChange={() => toggleInterviewExpanded(interview.id)}
                        >
                          <div className="rounded-lg border bg-card overflow-hidden">
                            <CollapsibleTrigger className="w-full">
                              <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-4">
                                  <div className="p-2 rounded-full bg-primary/10">
                                    <User className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="text-left">
                                    <h3 className="font-semibold">{interview.prospect_name || "Unknown"}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      Interviewed by {interview.interviewer_name || "Unknown"}
                                      {interview.interview_date &&
                                        ` on ${new Date(interview.interview_date).toLocaleDateString()}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge className={getStatusBadgeColor(interview.acceptance_status)}>
                                    {interview.acceptance_status || "Pending"}
                                  </Badge>
                                  {interview.is_pre_seed && (
                                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">Pre-SEED</Badge>
                                  )}
                                  {expandedInterviews.has(interview.id) ? (
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="px-4 pb-4 pt-0 border-t">
                                <div className="pt-4 space-y-4">
                                  {interview.prospect_email && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Mail className="h-4 w-4 text-muted-foreground" />
                                      <a
                                        href={`mailto:${interview.prospect_email}`}
                                        className="text-blue-600 hover:underline"
                                      >
                                        {interview.prospect_email}
                                      </a>
                                    </div>
                                  )}
                                  <div className="flex flex-wrap gap-4 text-sm">
                                    {interview.clinic_of_interest && (
                                      <div className="flex items-center gap-2">
                                        <Building className="h-4 w-4 text-muted-foreground" />
                                        <span>Interest: {interview.clinic_of_interest}</span>
                                      </div>
                                    )}
                                    {interview.suggested_clinic && (
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span>Assigned: {interview.suggested_clinic}</span>
                                      </div>
                                    )}
                                  </div>
                                  {interview.meeting_notes ? (
                                    <div className="bg-muted/50 rounded-lg p-4">
                                      <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        Meeting Notes
                                      </h4>
                                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {interview.meeting_notes}
                                      </p>
                                    </div>
                                  ) : (
                                    <Alert>
                                      <AlertCircle className="h-4 w-4" />
                                      <AlertTitle>No Notes</AlertTitle>
                                      <AlertDescription>
                                        No meeting notes were recorded for this interview.
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                </div>
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      ))
                    )}
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

export default function ProspectsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <ProspectsContent />
    </Suspense>
  )
}
