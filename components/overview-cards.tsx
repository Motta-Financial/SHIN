"use client"

import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Briefcase, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
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

interface OverviewCardsProps {
  selectedWeek: string
  selectedClinic: string
}

export function OverviewCards({ selectedWeek, selectedClinic }: OverviewCardsProps) {
  const [stats, setStats] = useState<OverviewStats>({
    activeStudents: 0,
    activeClients: 0,
    totalHours: 0,
    weeklyGrowth: 0,
  })
  const [activeStudents, setActiveStudents] = useState<Student[]>([])
  const [inactiveStudents, setInactiveStudents] = useState<{ name: string; clinic: string; role: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        console.log("[v0] Overview Cards - Selected clinic:", selectedClinic)

        const [clientsRes, debriefsRes, rosterRes] = await Promise.all([
          fetch("/api/airtable/clients"),
          fetch("/api/airtable/debriefs"),
          fetch("/api/airtable/roster"),
        ])

        if (!clientsRes.ok || !debriefsRes.ok || !rosterRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const clientsData = await clientsRes.json()
        const debriefsData = await debriefsRes.json()
        const rosterData = await rosterRes.json()

        const directorToClinicMap = new Map([
          ["Mark Dwyer", "Accounting"],
          ["Ken Mooney", "Consulting"],
          ["Nick Vadala", "Funding"],
          ["Christopher Hill", "Marketing"],
          ["Chris Hill", "Marketing"],
          ["Beth DiRusso", "Funding"],
        ])

        const roleToClinicMap = new Map([
          ["ACCTING CLINIC", "Accounting"],
          ["CONSULTING CLINIC", "Consulting"],
          ["RESOURCE CLINIC", "Funding"],
          ["MARKETING CLINIC", "Marketing"],
        ])

        const filterClinic =
          selectedClinic === "all" ? "all" : directorToClinicMap.get(selectedClinic) || selectedClinic
        console.log("[v0] Overview Cards - Filter clinic:", filterClinic)

        const activeStudentsMap = new Map<string, Student>()
        const activeClientIds = new Set<string>()
        let totalHours = 0

        if (debriefsData.records) {
          debriefsData.records.forEach((record: any) => {
            const fields = record.fields
            const weekEnding = fields["END DATE (from WEEK (from SEED | Schedule))"]
            const dateSubmitted = fields["Date Submitted"]

            let recordWeek = ""
            if (weekEnding) {
              recordWeek = Array.isArray(weekEnding) ? weekEnding[0] : weekEnding
            } else if (dateSubmitted) {
              const date = new Date(dateSubmitted)
              const day = date.getDay()
              const diff = 6 - day
              const weekEndingDate = new Date(date)
              weekEndingDate.setDate(date.getDate() + diff)
              recordWeek = weekEndingDate.toISOString().split("T")[0]
            }

            const studentRoleArray = fields["ROLE (from SEED | Students)"]
            const studentRole = Array.isArray(studentRoleArray) ? studentRoleArray[0] : studentRoleArray
            const studentClinic = roleToClinicMap.get(studentRole) || fields["Related Clinic"] || ""

            const matchesClinic = filterClinic === "all" || studentClinic === filterClinic

            if (recordWeek === selectedWeek && matchesClinic) {
              const studentNameArray = fields["NAME (from SEED | Students)"]
              const studentName = Array.isArray(studentNameArray) ? studentNameArray[0] : studentNameArray

              const hours = Number.parseFloat(fields["Number of Hours Worked"] || "0")
              const clientName = fields["Client"]
              const summary = fields["Summary of Work"] || ""

              if (studentName) {
                const existing = activeStudentsMap.get(studentName)
                if (existing) {
                  existing.hours += hours
                } else {
                  activeStudentsMap.set(studentName, {
                    name: studentName,
                    hours,
                    clinic: studentClinic,
                    client: clientName || "",
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

        console.log("[v0] Overview Cards - Active students:", activeStudentsMap.size)
        console.log("[v0] Overview Cards - Active clients:", activeClientIds.size)
        console.log("[v0] Overview Cards - Total hours:", totalHours)

        const allStudents = new Set<string>()
        const inactiveList: { name: string; clinic: string; role: string }[] = []

        if (rosterData.records) {
          rosterData.records.forEach((record: any) => {
            const fields = record.fields
            const name = fields["NAME"]
            const clinicRole = fields["Clinic| Role"]
            const role = fields["ROLE"]

            const studentClinic = roleToClinicMap.get(role) || fields["Related Clinic"] || ""

            if (name && clinicRole === "Student") {
              allStudents.add(name)

              const matchesClinic = filterClinic === "all" || studentClinic === filterClinic

              if (matchesClinic && !activeStudentsMap.has(name)) {
                inactiveList.push({
                  name,
                  clinic: studentClinic,
                  role: role || "",
                })
              }
            }
          })
        }

        console.log("[v0] Overview Cards - Inactive students:", inactiveList.length)

        setActiveStudents(Array.from(activeStudentsMap.values()))
        setInactiveStudents(inactiveList)
        setStats({
          activeStudents: activeStudentsMap.size,
          activeClients: activeClientIds.size,
          totalHours: Math.round(totalHours),
          weeklyGrowth: 0,
        })
      } catch (error) {
        console.error("[v0] Error fetching overview stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [selectedWeek, selectedClinic])

  const cards = [
    {
      title: "Active Students",
      value: loading ? "..." : stats.activeStudents,
      icon: Users,
      description: "Submitted this week",
      bgColor: "bg-[#002855]",
      iconBg: "bg-[#0077B6]",
      iconColor: "text-white",
      clickable: true,
      dialogContent: "active",
    },
    {
      title: "Inactive Students",
      value: loading ? "..." : inactiveStudents.length,
      icon: AlertCircle,
      description: "Haven't submitted",
      bgColor: "bg-amber-600",
      iconBg: "bg-amber-700",
      iconColor: "text-white",
      clickable: true,
      dialogContent: "inactive",
    },
    {
      title: "Active Clients",
      value: loading ? "..." : stats.activeClients,
      icon: Briefcase,
      description: "This week",
      bgColor: "bg-[#0077B6]",
      iconBg: "bg-[#002855]",
      iconColor: "text-white",
      clickable: false,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon

        if (card.clickable) {
          return (
            <Dialog key={card.title}>
              <DialogTrigger asChild>
                <Card
                  className={`p-6 ${card.bgColor} border-none shadow-lg cursor-pointer hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-white/80">{card.title}</p>
                      <p className="text-3xl font-bold text-white">{card.value}</p>
                      <p className="text-xs text-white/70">{card.description}</p>
                    </div>
                    <div className={`rounded-lg ${card.iconBg} p-3 shadow-md`}>
                      <Icon className={`h-5 w-5 ${card.iconColor}`} />
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
          <Card key={card.title} className={`p-6 ${card.bgColor} border-none shadow-lg`}>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-white/80">{card.title}</p>
                <p className="text-3xl font-bold text-white">{card.value}</p>
                <p className="text-xs text-white/70">{card.description}</p>
              </div>
              <div className={`rounded-lg ${card.iconBg} p-3 shadow-md`}>
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
