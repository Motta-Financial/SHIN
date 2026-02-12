"use client"

import { useState, useEffect, useMemo } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileText, Calendar, Clock, ChevronDown, ChevronUp, Building2, Plus } from "lucide-react"
import { useUserRole } from "@/hooks/use-user-role"
import { StudentPortalHeader } from "@/components/student-portal-header"

interface Debrief {
  id: string
  studentId: string
  studentEmail: string
  clientName: string
  clinic: string
  hoursWorked: string | number
  workSummary: string
  questions: string | null
  weekEnding: string
  createdAt: string
  status: string
  weekNumber: number
}

export default function StudentDebriefsPage() {
  const [debriefs, setDebriefs] = useState<Debrief[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDebrief, setExpandedDebrief] = useState<string | null>(null)
  const [studentInfo, setStudentInfo] = useState<{
    fullName: string
    email: string
    clinic: string
    clientName?: string
    clientId?: string
    clinicId?: string
    isTeamLeader: boolean
  } | null>(null)

  // Submit dialog state
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState("")
  const [debriefForm, setDebriefForm] = useState({ hoursWorked: "", workSummary: "", questions: "" })
  const [submitting, setSubmitting] = useState(false)
  const [semesterSchedule, setSemesterSchedule] = useState<Array<{
    id: string
    week_number: number
    week_start: string
    week_end: string
    is_break: boolean
    label?: string
  }>>([])

  const { studentId: authStudentId, isLoading: userLoading, isAuthenticated, role } = useUserRole()

  // Fetch student info using the authenticated student's ID
  useEffect(() => {
    async function fetchStudentInfo() {
      if (!authStudentId) return

      try {
        const url = `/api/supabase/v-complete-mapping?studentId=${authStudentId}`
        const response = await fetch(url)
        const data = await response.json()

        if (data.success && data.data?.length > 0) {
          const student = data.data[0]
          setStudentInfo({
            fullName: student.student_name || "Student",
            email: student.student_email || "",
            clinic: student.student_clinic_name || "Unknown Clinic",
            clientName: student.client_name,
            clientId: student.client_id || "",
            clinicId: student.clinic_id || "",
            isTeamLeader: student.student_role === "Team Leader",
          })
        }
      } catch (error) {
        console.error("Error fetching student info:", error)
      }
    }

    if (!userLoading && authStudentId) {
      fetchStudentInfo()
    }
  }, [authStudentId, userLoading])

  // Fetch debriefs for the current student using their ID
  useEffect(() => {
    async function fetchDebriefs() {
      if (!authStudentId) return

      try {
        const response = await fetch(
          `/api/supabase/debriefs?studentId=${authStudentId}`,
        )
        const data = await response.json()
        if (data.debriefs) {
          setDebriefs(data.debriefs)
        }
      } catch (error) {
        console.error("Error fetching debriefs:", error)
      } finally {
        setLoading(false)
      }
    }

    if (!userLoading && authStudentId) {
      fetchDebriefs()
    }
  }, [authStudentId, userLoading])

  // Fetch semester schedule for week selector
  useEffect(() => {
    async function fetchSchedule() {
      try {
        const res = await fetch("/api/semester-schedule")
        if (res.ok) {
          const data = await res.json()
          if (data.schedule) {
            setSemesterSchedule(data.schedule.filter((w: any) => !w.is_break))
          }
        }
      } catch {
        // silently handle
      }
    }
    fetchSchedule()
  }, [])

  // Submit debrief handler
  const handleSubmitDebrief = async () => {
    if (!selectedWeek || !debriefForm.hoursWorked || !debriefForm.workSummary || !studentInfo || !authStudentId) return

    setSubmitting(true)
    try {
      const week = semesterSchedule.find((w) => w.id === selectedWeek)
      if (!week) return

      const response = await fetch("/api/supabase/debriefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: authStudentId,
          studentName: studentInfo.fullName,
          studentEmail: studentInfo.email,
          clientId: studentInfo.clientId || null,
          clientName: studentInfo.clientName || null,
          clinic: studentInfo.clinic,
          clinicId: studentInfo.clinicId || null,
          weekEnding: week.week_end,
          weekNumber: week.week_number,
          hoursWorked: Number.parseFloat(debriefForm.hoursWorked),
          workSummary: debriefForm.workSummary,
          questions: debriefForm.questions || null,
          questionType: debriefForm.questions ? "clinic" : null,
          status: "pending",
        }),
      })

      if (!response.ok) throw new Error("Failed to submit")

      // Refresh debriefs list
      const debriefRes = await fetch(`/api/supabase/debriefs?studentId=${authStudentId}`)
      if (debriefRes.ok) {
        const data = await debriefRes.json()
        setDebriefs(data.debriefs || [])
      }

      setShowSubmitDialog(false)
      setDebriefForm({ hoursWorked: "", workSummary: "", questions: "" })
      setSelectedWeek("")
    } catch {
      // silently handle
    } finally {
      setSubmitting(false)
    }
  }

  // Group debriefs by week
  const debriefsbyWeek = useMemo(() => {
    const grouped: Record<number, Debrief[]> = {}
    debriefs.forEach((d) => {
      if (!grouped[d.weekNumber]) {
        grouped[d.weekNumber] = []
      }
      grouped[d.weekNumber].push(d)
    })
    return grouped
  }, [debriefs])

  const totalHours = debriefs.reduce((sum, d) => sum + Number.parseFloat(String(d.hoursWorked) || "0"), 0)

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "submitted":
        return <Badge className="bg-green-100 text-green-700">Submitted</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
      case "reviewed":
        return <Badge className="bg-blue-100 text-blue-700">Reviewed</Badge>
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>

      <div className="pl-52 pt-14">
        <main className="p-6 space-y-6">
          <StudentPortalHeader
            loading={userLoading || loading}
            currentStudent={studentInfo}
            totalHours={totalHours}
            totalAttendance={debriefs.length}
          />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Debriefs</h1>
              <p className="text-sm text-slate-500">View your submitted weekly debriefs and work summaries</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">{totalHours.toFixed(1)} total hours logged</span>
              </div>
              <Button
                onClick={() => {
                  setDebriefForm({ hoursWorked: "", workSummary: "", questions: "" })
                  setSelectedWeek("")
                  setShowSubmitDialog(true)
                }}
                className="bg-[#1B2C5C] hover:bg-[#152347] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Submit a Debrief
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : debriefs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700">No Debriefs Yet</h3>
                <p className="text-sm text-slate-500 mt-1 mb-4">Your submitted debriefs will appear here.</p>
                <Button
                  onClick={() => {
                    setDebriefForm({ hoursWorked: "", workSummary: "", questions: "" })
                    setSelectedWeek("")
                    setShowSubmitDialog(true)
                  }}
                  className="bg-[#1B2C5C] hover:bg-[#152347] text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Your First Debrief
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(debriefsbyWeek)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([weekNum, weekDebriefs]) => (
                  <Card key={weekNum} className="overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-slate-600" />
                          Week {weekNum}
                        </CardTitle>
                        <Badge variant="outline">
                          {weekDebriefs.length} debrief{weekDebriefs.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {weekDebriefs.map((debrief) => (
                        <div
                          key={debrief.id}
                          className="border-b last:border-b-0 hover:bg-slate-50/50 transition-colors"
                        >
                          <button
                            className="w-full p-4 text-left"
                            onClick={() => setExpandedDebrief(expandedDebrief === debrief.id ? null : debrief.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{debrief.clientName}</p>
                                  <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span>{debrief.hoursWorked} hours</span>
                                    <span>•</span>
                                    <span>{new Date(debrief.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {getStatusBadge(debrief.status)}
                                {expandedDebrief === debrief.id ? (
                                  <ChevronUp className="h-5 w-5 text-slate-400" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-slate-400" />
                                )}
                              </div>
                            </div>
                          </button>

                          {expandedDebrief === debrief.id && (
                            <div className="px-4 pb-4 space-y-4 border-t bg-slate-50/50">
                              <div className="pt-4">
                                <h4 className="text-sm font-medium text-slate-700 mb-2">Work Summary</h4>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                  {debrief.workSummary || "No summary provided."}
                                </p>
                              </div>

                              {debrief.questions && (
                                <div>
                                  <h4 className="text-sm font-medium text-slate-700 mb-2">Questions/Notes</h4>
                                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{debrief.questions}</p>
                                </div>
                              )}

                              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t">
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {debrief.clinic}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Week ending: {debrief.weekEnding}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </main>
      </div>

      {/* Submit Debrief Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#1B2C5C]" />
              Submit a Debrief
            </DialogTitle>
            <DialogDescription>
              Log your hours and summarize your work for the selected week.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Week Selector */}
            <div className="space-y-2">
              <Label htmlFor="week-select">Week</Label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger id="week-select">
                  <SelectValue placeholder="Select a week" />
                </SelectTrigger>
                <SelectContent>
                  {semesterSchedule.map((week) => (
                    <SelectItem key={week.id} value={week.id}>
                      Week {week.week_number} - ending {new Date(week.week_end + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hours Worked */}
            <div className="space-y-2">
              <Label htmlFor="hours-worked">Hours Worked</Label>
              <Input
                id="hours-worked"
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 3.5"
                value={debriefForm.hoursWorked}
                onChange={(e) => setDebriefForm((prev) => ({ ...prev, hoursWorked: e.target.value }))}
              />
            </div>

            {/* Work Summary */}
            <div className="space-y-2">
              <Label htmlFor="work-summary">Work Summary</Label>
              <Textarea
                id="work-summary"
                placeholder="Describe what you worked on this week..."
                rows={4}
                value={debriefForm.workSummary}
                onChange={(e) => setDebriefForm((prev) => ({ ...prev, workSummary: e.target.value }))}
              />
            </div>

            {/* Questions (optional) */}
            <div className="space-y-2">
              <Label htmlFor="questions">
                Questions / Notes <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="questions"
                placeholder="Any questions or notes for your director..."
                rows={2}
                value={debriefForm.questions}
                onChange={(e) => setDebriefForm((prev) => ({ ...prev, questions: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDebrief}
              disabled={submitting || !selectedWeek || !debriefForm.hoursWorked || !debriefForm.workSummary}
              className="bg-[#1B2C5C] hover:bg-[#152347] text-white"
            >
              {submitting ? "Submitting..." : "Submit Debrief"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
