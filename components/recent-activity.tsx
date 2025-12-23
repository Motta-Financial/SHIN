"use client"

import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useEffect, useState } from "react"
import { FileText, Clock } from "lucide-react"
import { getClinicColor } from "@/lib/clinic-colors"

interface Activity {
  id: string
  type: "debrief"
  student: string
  description: string
  workSummary: string
  timestamp: string
  clinic?: string
  hours: number
}

interface RecentActivityProps {
  selectedWeeks: string[]
  selectedClinic: string
}

export function RecentActivity({ selectedWeeks, selectedClinic }: RecentActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch("/api/supabase/debriefs")
        if (res.ok) {
          const data = await res.json()
          const debriefs = data.debriefs || []

          const filteredRecords = debriefs.filter((debrief: any) => {
            const recordWeek = debrief.week_ending || debrief.weekEnding || ""
            const relatedClinic = debrief.clinic || ""
            const matchesClinic = selectedClinic === "all" || relatedClinic === selectedClinic
            const matchesWeek = selectedWeeks.length === 0 || selectedWeeks.includes(recordWeek)
            return matchesWeek && matchesClinic
          })

          const sortedRecords = filteredRecords
            .sort((a: any, b: any) => {
              const dateA = new Date(a.week_ending || a.weekEnding || 0)
              const dateB = new Date(b.week_ending || b.weekEnding || 0)
              return dateB.getTime() - dateA.getTime()
            })
            .slice(0, 10)

          const activityList: Activity[] = sortedRecords.map((debrief: any) => {
            const studentName = debrief.student_name || debrief.studentName || "Unknown"
            const hours = Number.parseFloat(debrief.hours_worked || debrief.hoursWorked || "0")
            const workDescription = debrief.work_summary || debrief.workSummary || ""
            const clinic = debrief.clinic || ""
            const workPreview = workDescription.length > 60 ? `${workDescription.substring(0, 60)}...` : workDescription

            return {
              id: debrief.id,
              type: "debrief",
              student: studentName,
              description: `Logged ${hours} hours`,
              workSummary: workPreview,
              timestamp: "This week",
              clinic,
              hours,
            }
          })

          setActivities(activityList)
        }
      } catch (error) {
        console.error("Error fetching debriefs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedWeeks, selectedClinic])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (loading) {
    return (
      <Card className="p-6 bg-white border-[#002855]/20 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#002855]">Recent Activity</h2>
          <p className="text-sm text-[#002855]/70">Latest updates from students</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0077B6]"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-blue-600/10 border-2 border-blue-200/50 shadow-lg backdrop-blur-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#002855]">Recent Activity</h2>
        <p className="text-sm text-[#002855]/70">Latest updates from students</p>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-center text-[#002855]/50 py-8">No recent activity</p>
        ) : (
          activities.map((activity) => {
            const Icon = activity.type === "debrief" ? FileText : Clock
            const colors = getClinicColor(activity.clinic)

            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 rounded-lg border-2 border-blue-200/50 bg-white/80 backdrop-blur-sm p-4 transition-all hover:border-blue-400 hover:shadow-xl hover:scale-[1.02] hover:bg-white"
              >
                <Avatar className="h-10 w-10 border-2 border-blue-500">
                  <AvatarFallback className="bg-blue-600 text-white font-semibold text-xs">
                    {getInitials(activity.student)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-[#002855]">{activity.student}</p>
                    {activity.clinic && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
                        {activity.clinic}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#002855]/70">{activity.description}</p>
                  {activity.workSummary && (
                    <p className="text-xs text-[#002855]/60 italic mt-1">"{activity.workSummary}"</p>
                  )}
                  <p className="text-xs text-[#002855]/50">{activity.timestamp}</p>
                </div>

                <div className="rounded-lg bg-blue-500/20 p-2 border border-blue-300">
                  <Icon className="h-4 w-4 text-blue-700" />
                </div>
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}
