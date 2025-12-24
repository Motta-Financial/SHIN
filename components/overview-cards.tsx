"use client"

import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Briefcase, AlertCircle } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { getClinicColor } from "@/lib/clinic-colors"
import { createBrowserClient } from "@supabase/ssr"

interface OverviewStats {
  activeStudents: number
  activeClients: number
  totalHours: number
  weeklyGrowth: number
}

interface Student {
  name: string
  hours: number
  clinic: string
  client: string
  summary: string
}

interface WeekSchedule {
  value: string
  label: string
  weekNumber: number
  isBreak: boolean
  weekStart: string
  weekEnd: string
}

interface OverviewCardsProps {
  selectedWeeks: string[]
  selectedClinic: string // This is now a director ID (UUID), not a clinic name
  weekSchedule?: WeekSchedule[]
}

export function OverviewCards({ selectedWeeks, selectedClinic, weekSchedule = [] }: OverviewCardsProps) {
  const [studentOverview, setStudentOverview] = useState<any[]>([])
  const [debriefs, setDebriefs] = useState<any[]>([])
  const [directorStudentIds, setDirectorStudentIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const isDateInWeekRange = (dateStr: string, selectedWeekValues: string[]): boolean => {
    if (selectedWeekValues.length === 0) return true

    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return false

    return selectedWeekValues.some((weekValue) => {
      const week = weekSchedule.find((w) => w.value === weekValue)
      if (!week) return false

      const weekStart = new Date(week.weekStart)
      const weekEnd = new Date(week.weekEnd)
      weekEnd.setDate(weekEnd.getDate() + 1)

      return date >= weekStart && date < weekEnd
    })
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        let studentIdsForDirector: string[] = []

        if (selectedClinic && selectedClinic !== "all") {
          // Get director's clinic_id from clinic_directors table (proper mapping)
          const { data: clinicDirectorData } = await supabase
            .from("clinic_directors")
            .select("clinic_id")
            .eq("director_id", selectedClinic)
            .single()

          if (clinicDirectorData?.clinic_id) {
            // Get students from director's clinic via clinic_students
            const { data: clinicStudents } = await supabase
              .from("clinic_students")
              .select("student_id")
              .eq("clinic_id", clinicDirectorData.clinic_id)

            if (clinicStudents) {
              studentIdsForDirector.push(...clinicStudents.map((s: { student_id: string }) => s.student_id))
              console.log("[v0] OverviewCards - Students from clinic_students:", clinicStudents.length)
            }
          }

          // Get students from clients where this director is primary
          const { data: clientsData } = await supabase
            .from("clients")
            .select("id")
            .eq("primary_director_id", selectedClinic)

          if (clientsData && clientsData.length > 0) {
            const clientIds = clientsData.map((c: { id: string }) => c.id)

            const { data: assignmentsData } = await supabase
              .from("client_assignments")
              .select("student_id")
              .in("client_id", clientIds)

            if (assignmentsData) {
              studentIdsForDirector.push(...assignmentsData.map((a: { student_id: string }) => a.student_id))
              console.log("[v0] OverviewCards - Students from client_assignments:", assignmentsData.length)
            }
          }

          // Deduplicate
          studentIdsForDirector = [...new Set(studentIdsForDirector)]
          console.log("[v0] OverviewCards - Total unique director student IDs:", studentIdsForDirector.length)
        }

        setDirectorStudentIds(studentIdsForDirector)

        // Fetch all data
        const [overviewRes, debriefsRes] = await Promise.all([
          fetch("/api/supabase/students/overview"),
          fetch("/api/supabase/debriefs"),
        ])

        if (overviewRes.ok) {
          const data = await overviewRes.json()
          setStudentOverview(data.students || [])
        }

        if (debriefsRes.ok) {
          const data = await debriefsRes.json()
          setDebriefs(data.debriefs || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedClinic])

  const { stats, activeStudents, inactiveStudents } = useMemo(() => {
    if (loading) {
      return {
        stats: { activeStudents: 0, activeClients: 0, totalHours: 0, weeklyGrowth: 0 },
        activeStudents: [],
        inactiveStudents: [],
      }
    }

    const allStudentsInClinic =
      selectedClinic === "all" || !selectedClinic || directorStudentIds.length === 0
        ? studentOverview
        : studentOverview.filter((student) => directorStudentIds.includes(student.student_id))

    console.log("[v0] OverviewCards - allStudentsInClinic count:", allStudentsInClinic.length)

    const studentsWhoSubmitted = new Map<
      string,
      {
        studentId: string
        name: string
        hours: number
        clinic: string
        client: string
        summary: string
      }
    >()

    const activeClientNames = new Set<string>()
    let totalHours = 0

    debriefs.forEach((debrief: any) => {
      const recordWeek = debrief.weekEnding || debrief.week_ending || ""
      const matchesWeek = isDateInWeekRange(recordWeek, selectedWeeks)

      if (!matchesWeek) return

      const studentId = debrief.studentId || debrief.student_id

      const matchesDirector =
        selectedClinic === "all" ||
        !selectedClinic ||
        directorStudentIds.length === 0 ||
        directorStudentIds.includes(studentId)

      if (!matchesDirector) return

      const hours = Number.parseFloat(debrief.hoursWorked || debrief.hours_worked || "0")
      const clientName = debrief.clientName || debrief.client_name || ""
      const studentName = debrief.studentName || debrief.student_name || ""
      const summary = debrief.workSummary || debrief.work_summary || ""
      const clinic = debrief.clinic || ""

      if (studentId) {
        const existing = studentsWhoSubmitted.get(studentId)
        if (existing) {
          existing.hours += hours
        } else {
          studentsWhoSubmitted.set(studentId, {
            studentId,
            name: studentName,
            hours,
            clinic,
            client: clientName,
            summary,
          })
        }
      }

      if (clientName) {
        activeClientNames.add(clientName)
      }

      totalHours += hours
    })

    const activeStudentsList = Array.from(studentsWhoSubmitted.values())
    const activeStudentIds = new Set(activeStudentsList.map((s) => s.studentId))

    const inactiveStudentsList = allStudentsInClinic
      .filter((student) => !activeStudentIds.has(student.student_id))
      .map((student) => ({
        name: student.student_name || student.full_name || "Unknown",
        hours: 0,
        clinic: student.clinic || "Unknown",
        client: student.client_name || "Unassigned",
        summary: "No debrief submitted",
      }))

    console.log("[v0] OverviewCards - Active:", activeStudentsList.length, "Inactive:", inactiveStudentsList.length)

    return {
      stats: {
        activeStudents: activeStudentsList.length,
        activeClients: activeClientNames.size,
        totalHours,
        weeklyGrowth: 0,
      },
      activeStudents: activeStudentsList,
      inactiveStudents: inactiveStudentsList,
    }
  }, [loading, studentOverview, debriefs, selectedWeeks, selectedClinic, directorStudentIds, weekSchedule])

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Dialog>
        <DialogTrigger asChild>
          <Card className="cursor-pointer p-6 transition-colors hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold">{stats.activeStudents}</p>
                <p className="text-xs text-muted-foreground">Submitted debriefs this week</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Active Students</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {activeStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active students for selected period</p>
            ) : (
              activeStudents.map((student, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{student.name}</span>
                    <span className="text-sm text-muted-foreground">{student.hours.toFixed(1)} hrs</span>
                  </div>
                  <div className="mt-1 flex gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: getClinicColor(student.clinic).bg,
                        color: getClinicColor(student.clinic).text,
                      }}
                    >
                      {student.clinic}
                    </span>
                    <span className="text-xs text-muted-foreground">{student.client}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Card className="cursor-pointer p-6 transition-colors hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive Students</p>
                <p className="text-2xl font-bold">{inactiveStudents.length}</p>
                <p className="text-xs text-muted-foreground">No debrief this week</p>
              </div>
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Inactive Students</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {inactiveStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">All students have submitted debriefs</p>
            ) : (
              inactiveStudents.map((student, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{student.name}</span>
                    <span className="text-xs text-red-500">Missing debrief</span>
                  </div>
                  <div className="mt-1 flex gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: getClinicColor(student.clinic).bg,
                        color: getClinicColor(student.clinic).text,
                      }}
                    >
                      {student.clinic}
                    </span>
                    <span className="text-xs text-muted-foreground">{student.client}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
            <p className="text-2xl font-bold">{stats.activeClients}</p>
            <p className="text-xs text-muted-foreground">With activity this week</p>
          </div>
          <Briefcase className="h-8 w-8 text-muted-foreground" />
        </div>
      </Card>
    </div>
  )
}
