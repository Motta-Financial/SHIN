"use client"

import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useEffect, useState } from "react"
import { FileText, Clock, CalendarCheck, Users, Calendar, CheckCircle, Bell } from "lucide-react"
import { getClinicColor } from "@/lib/clinic-colors"

interface Activity {
  id: string
  type: "debrief" | "debrief_submitted" | "debrief_question" | "attendance" | "meeting_request" | "agenda_published" | "announcement" | "attendance_approved" | "attendance_ready" | "attendance_open"
  student: string
  title: string
  message: string
  timestamp: string
  clinic?: string
  isRead: boolean
}

interface RecentActivityProps {
  selectedWeeks: string[]
  selectedClinic: string
  directorId?: string
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "debrief":
    case "debrief_submitted":
      return FileText
    case "debrief_question":
      return Clock
    case "attendance":
      return CalendarCheck
    case "meeting_request":
      return Users
    case "agenda_published":
    case "announcement":
      return Calendar
    case "attendance_approved":
      return CheckCircle
    case "attendance_ready":
    case "attendance_open":
      return Bell
    default:
      return Clock
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case "debrief":
    case "debrief_submitted":
      return "bg-blue-500/20 border-blue-300 text-blue-700"
    case "debrief_question":
      return "bg-orange-500/20 border-orange-300 text-orange-700"
    case "attendance":
      return "bg-green-500/20 border-green-300 text-green-700"
    case "meeting_request":
      return "bg-purple-500/20 border-purple-300 text-purple-700"
    case "agenda_published":
    case "announcement":
      return "bg-amber-500/20 border-amber-300 text-amber-700"
    case "attendance_approved":
      return "bg-teal-500/20 border-teal-300 text-teal-700"
    case "attendance_ready":
    case "attendance_open":
      return "bg-orange-500/20 border-orange-300 text-orange-700"
    default:
      return "bg-gray-500/20 border-gray-300 text-gray-700"
  }
}

const formatTimestamp = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function RecentActivity({ selectedWeeks, selectedClinic, directorId }: RecentActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // Fetch notifications from the notifications table
        const params = new URLSearchParams()
        if (directorId) params.append("directorId", directorId)
        if (selectedClinic && selectedClinic !== "all") params.append("clinic", selectedClinic)
        
        const res = await fetch(`/api/notifications?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          const notifications = data.notifications || []

          const activityList: Activity[] = notifications.map((notif: any) => ({
            id: notif.id,
            type: notif.type || "debrief",
            student: notif.student_name || "System",
            title: notif.title || "",
            message: notif.message || "",
            timestamp: formatTimestamp(notif.created_at),
            clinic: notif.clinic || "",
            isRead: notif.is_read || false,
          }))

          setActivities(activityList)
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedWeeks, selectedClinic, directorId])

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
            const Icon = getActivityIcon(activity.type)
            const iconColors = getActivityColor(activity.type)
            const clinicColors = activity.clinic ? getClinicColor(activity.clinic) : null

            return (
              <div
                key={activity.id}
                className={`flex items-start gap-4 rounded-lg border-2 ${activity.isRead ? "border-blue-100/50 bg-white/60" : "border-blue-200/50 bg-white/80"} backdrop-blur-sm p-4 transition-all hover:border-blue-400 hover:shadow-xl hover:scale-[1.02] hover:bg-white`}
              >
                <Avatar className="h-10 w-10 border-2 border-blue-500">
                  <AvatarFallback className="bg-blue-600 text-white font-semibold text-xs">
                    {getInitials(activity.student)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-[#002855]">{activity.student}</p>
                    {activity.clinic && clinicColors && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${clinicColors.bg} ${clinicColors.text}`}>
                        {activity.clinic}
                      </span>
                    )}
                    {!activity.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" title="Unread" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-[#002855]/80">{activity.title}</p>
                  {activity.message && (
                    <p className="text-xs text-[#002855]/60">{activity.message}</p>
                  )}
                  <p className="text-xs text-[#002855]/50">{activity.timestamp}</p>
                </div>

                <div className={`rounded-lg p-2 border ${iconColors}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}
