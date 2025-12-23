"use client"

import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Briefcase, AlertCircle } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { getClinicColor } from "@/lib/clinic-colors"

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
  selectedClinic: string
  weekSchedule?: WeekSchedule[]
}

export function OverviewCards({ selectedWeeks, selectedClinic, weekSchedule = [] }: OverviewCardsProps) {
  const [debriefs, setDebriefs] = useState<any[]>([])
  const [roster, setRoster] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const isDateInWeekRange = (dateStr: string, selectedWeekValues: string[]): boolean => {
    if (selectedWeekValues.length === 0) return true // No filter = all data

    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return false

    return selectedWeekValues.some((weekValue) => {
      const week = weekSchedule.find((w) => w.value === weekValue)
      if (!week) return false

      const weekStart = new Date(week.weekStart)
      const weekEnd = new Date(week.weekEnd)
      // Add 1 day to weekEnd to make it inclusive
      weekEnd.setDate(weekEnd.getDate() + 1)

      return date >= weekStart && date < weekEnd
    })
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [debriefsRes, rosterRes] = await Promise.all([
          fetch("/api/supabase/debriefs"),
          fetch("/api/supabase/roster"),
        ])

        if (debriefsRes.ok) {
          const data = await debriefsRes.json()
          setDebriefs(data.debriefs || [])
        }

        if (rosterRes.ok) {
          const data = await rosterRes.json()
          setRoster(data.students || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const { stats, activeStudents, inactiveStudents } = useMemo(() => {
    if (loading) {
      return {
        stats: { activeStudents: 0, activeClients: 0, totalHours: 0, weeklyGrowth: 0 },
        activeStudents: [],
        inactiveStudents: [],
      }
    }

    const directorToClinicMap = new Map([
      ["Mark Dwyer", "Accounting"],
      ["Dat Le", "Accounting"],
      ["Nick Vadala", "Consulting"],
      ["Ken Mooney", "Resource Acquisition"],
      ["Christopher Hill", "Marketing"],
      ["Chris Hill", "Marketing"],
      ["Beth DiRusso", "Legal"],
      ["Darrell Mottley", "Legal"],
      ["Boris Lazic", "SEED"],
      ["Grace Cha", "SEED"],
      ["Chaim Letwin", "SEED"],
      ["Dmitri Tcherevik", "SEED"],
    ])

    const filterClinic = selectedClinic === "all" ? "all" : directorToClinicMap.get(selectedClinic) || selectedClinic

    const activeStudentsMap = new Map<string, Student>()
    const activeClientIds = new Set<string>()
    let totalHours = 0

    if (debriefs.length > 0) {
      debriefs.forEach((debrief: any) => {
        const recordWeek = debrief.week_ending || debrief.weekEnding || ""
        const studentClinic = debrief.clinic || ""
        const clientName = debrief.client_name || debrief.clientName || ""
        const hours = Number.parseFloat(debrief.hours_worked || debrief.hoursWorked || "0")
        const summary = debrief.work_summary || debrief.workSummary || ""
        const studentName = debrief.student_name || debrief.studentName || ""

        const normalizedClinic = studentClinic.replace(" Clinic", "").trim()
        const matchesClinic =
          filterClinic === "all" || normalizedClinic.includes(filterClinic) || studentClinic.includes(filterClinic)
        const matchesWeek = isDateInWeekRange(recordWeek, selectedWeeks)

        if (matchesWeek && matchesClinic) {
          if (studentName) {
            const existing = activeStudentsMap.get(studentName)
            if (existing) {
              existing.hours += hours
            } else {
              activeStudentsMap.set(studentName, {
                name: studentName,
                hours,
                clinic: studentClinic,
                client: clientName,
                summary,
              })
            }
          }
          if (clientName) {
            activeClientIds.add(clientName)
          }
          totalHours += hours
        }
      })
    }

    const inactiveList: { name: string; clinic: string; role: string }[] = []

    if (roster.length > 0) {
      roster.forEach((record: any) => {
        const name = record.fullName || record.full_name || `${record.firstName || ""} ${record.lastName || ""}`.trim()
        const studentClinic = record.clinic || ""
        const clientTeam = record.clientTeam || record.client_team || ""
        const status = record.status || ""

        if (name && status === "Active") {
          const normalizedClinic = studentClinic.replace(" Clinic", "").trim()
          const matchesClinic =
            filterClinic === "all" || normalizedClinic.includes(filterClinic) || studentClinic.includes(filterClinic)

          if (matchesClinic && !activeStudentsMap.has(name)) {
            inactiveList.push({
              name,
              clinic: studentClinic,
              role: clientTeam,
            })
          }
        }
      })
    }

    return {
      stats: {
        activeStudents: activeStudentsMap.size,
        activeClients: activeClientIds.size,
        totalHours: Math.round(totalHours),
        weeklyGrowth: 0,
      },
      activeStudents: Array.from(activeStudentsMap.values()),
      inactiveStudents: inactiveList,
    }
  }, [debriefs, roster, loading, selectedWeeks, selectedClinic, weekSchedule])

  const cards = [
    {
      title: "Active Students",
      value: loading ? "..." : stats.activeStudents,
      icon: Users,
      description: "Submitted this week",
      bgColor: "bg-[#2d3a4f]", // Using palette colors - Passionate Blueberry (dark navy)
      iconBg: "bg-[#8fa889]", // Banyan Serenity
      iconColor: "text-[#2d3a4f]",
      clickable: true,
      dialogContent: "active",
    },
    {
      title: "Inactive Students",
      value: loading ? "..." : inactiveStudents.length,
      icon: AlertCircle,
      description: "Haven't submitted",
      bgColor: "bg-[#565f4b]", // Using palette colors - Jalapeno Poppers (olive)
      iconBg: "bg-[#9aacb8]", // Tsunami
      iconColor: "text-[#565f4b]",
      clickable: true,
      dialogContent: "inactive",
    },
    {
      title: "Active Clients",
      value: loading ? "..." : stats.activeClients,
      icon: Briefcase,
      description: "This week",
      bgColor: "bg-[#5f7082]", // Using palette colors - Silver Blueberry
      iconBg: "bg-[#8fa889]", // Banyan Serenity
      iconColor: "text-[#5f7082]",
      clickable: false,
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon

        if (card.clickable) {
          return (
            <Dialog key={card.title}>
              <DialogTrigger asChild>
                <Card
                  className={`p-4 ${card.bgColor} border-none shadow-lg cursor-pointer hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-white/80">{card.title}</p>
                      <p className="text-2xl font-bold text-white">{card.value}</p>
                      <p className="text-xs text-white/70">{card.description}</p>
                    </div>
                    <div className={`rounded-lg ${card.iconBg} p-2 shadow-md`}>
                      <Icon className={`h-4 w-4 ${card.iconColor}`} />
                    </div>
                  </div>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {card.dialogContent === "active"
                      ? `Active Students (${activeStudents.length})`
                      : `Inactive Students (${inactiveStudents.length})`}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {card.dialogContent === "active" ? (
                    activeStudents.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No active students for this week</p>
                    ) : (
                      activeStudents.map((student) => (
                        <div key={student.name} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{student.name}</h3>
                            <span className="text-sm font-medium">{student.hours}h</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: getClinicColor(student.clinic).hex + "20",
                                color: getClinicColor(student.clinic).hex,
                              }}
                            >
                              {student.clinic}
                            </span>
                            <span className="text-sm text-muted-foreground">• {student.client}</span>
                          </div>
                          {student.summary && <p className="text-sm text-muted-foreground">{student.summary}</p>}
                        </div>
                      ))
                    )
                  ) : inactiveStudents.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">All students have submitted this week!</p>
                  ) : (
                    inactiveStudents.map((student) => (
                      <div key={student.name} className="border rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.role}</p>
                        </div>
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: getClinicColor(student.clinic).hex + "20",
                            color: getClinicColor(student.clinic).hex,
                          }}
                        >
                          {student.clinic}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )
        }

        return (
          <Card key={card.title} className={`p-4 ${card.bgColor} border-none shadow-lg`}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-white/80">{card.title}</p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-xs text-white/70">{card.description}</p>
              </div>
              <div className={`rounded-lg ${card.iconBg} p-2 shadow-md`}>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
