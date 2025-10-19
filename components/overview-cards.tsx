"use client"

import { Card } from "@/components/ui/card"
import { Users, Briefcase, Clock, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"

interface OverviewStats {
  activeStudents: number
  activeClients: number
  totalHours: number
  weeklyGrowth: number
}

interface OverviewCardsProps {
  selectedWeek: string
  selectedClinic: string // Added selectedClinic prop
}

export function OverviewCards({ selectedWeek, selectedClinic }: OverviewCardsProps) {
  const [stats, setStats] = useState<OverviewStats>({
    activeStudents: 0,
    activeClients: 0,
    totalHours: 0,
    weeklyGrowth: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [clientsRes, debriefsRes] = await Promise.all([
          fetch("/api/airtable/clients"),
          fetch("/api/airtable/debriefs"),
        ])

        if (!clientsRes.ok || !debriefsRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const clientsData = await clientsRes.json()
        const debriefsData = await debriefsRes.json()

        const uniqueStudents = new Set<string>()
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

            const relatedClinic = fields["Related Clinic"]
            const matchesClinic = selectedClinic === "all" || relatedClinic === selectedClinic

            if (recordWeek === selectedWeek && matchesClinic) {
              const studentNameArray = fields["NAME (from SEED | Students)"]
              const studentName = Array.isArray(studentNameArray) ? studentNameArray[0] : studentNameArray

              const hours = Number.parseFloat(fields["Number of Hours Worked"] || "0")
              const clientName = fields["Client"]

              if (studentName) {
                uniqueStudents.add(studentName)
              }

              if (clientName) {
                activeClientIds.add(clientName)
              }

              totalHours += hours
            }
          })
        }

        setStats({
          activeStudents: uniqueStudents.size,
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
  }, [selectedWeek, selectedClinic]) // Added selectedClinic to dependencies

  const cards = [
    {
      title: "Active Students",
      value: loading ? "..." : stats.activeStudents,
      icon: Users,
      description: "This week",
      bgColor: "bg-[#002855]",
      iconBg: "bg-[#0077B6]",
      iconColor: "text-white",
    },
    {
      title: "Active Clients",
      value: loading ? "..." : stats.activeClients,
      icon: Briefcase,
      description: "This week",
      bgColor: "bg-[#003d7a]",
      iconBg: "bg-[#0096C7]",
      iconColor: "text-white",
    },
    {
      title: "Total Hours",
      value: loading ? "..." : stats.totalHours,
      icon: Clock,
      description: "This week",
      bgColor: "bg-[#0077B6]",
      iconBg: "bg-[#002855]",
      iconColor: "text-white",
    },
    {
      title: "Avg Hours/Student",
      value: loading ? "..." : stats.activeStudents > 0 ? Math.round(stats.totalHours / stats.activeStudents) : 0,
      icon: TrendingUp,
      description: "This week",
      bgColor: "bg-[#0096C7]",
      iconBg: "bg-[#002855]",
      iconColor: "text-white",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
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
