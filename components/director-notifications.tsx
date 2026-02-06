"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, FileText, HelpCircle, Check, X, Users, Calendar, Inbox, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type NotificationType = "document_upload" | "question" | "meeting_request" | "announcement" | "debrief" | "attendance" | "debrief_submitted" | "debrief_question"

type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string
  related_id?: string
  student_id?: string
  student_name?: string
  student_email?: string
  clinic?: string
  clinic_id?: string
  director_id?: string
  is_read: boolean
  created_at: string
}

type TabCategory = "all" | "documents" | "questions" | "meetings" | "debriefs" | "announcements"

interface DirectorNotificationsProps {
  selectedClinic: string
  compact?: boolean
}

async function fetchWithRetry(url: string, options?: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // Check for rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After")
        const delay = retryAfter ? Number.parseInt(retryAfter) * 1000 : Math.pow(2, attempt + 1) * 1000
        console.log(`[v0] Rate limited, waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // Check if response is not OK and might be a rate limit text response
      if (!response.ok) {
        const text = await response.text()
        if (text.startsWith("Too Many R")) {
          const delay = Math.pow(2, attempt + 1) * 1000
          console.log(`[v0] Rate limit text response, waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
        // Try to parse as JSON error
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.error || `HTTP ${response.status}`)
        } catch {
          throw new Error(text || `HTTP ${response.status}`)
        }
      }

      return response
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt + 1) * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error("Failed after retries")
}

export function DirectorNotifications({ selectedClinic, compact = false }: DirectorNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [meetingRequests, setMeetingRequests] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<TabCategory>("all")

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true)
      try {
        // Fetch notifications and meeting requests sequentially to avoid rate limiting
        const notifResponse = await fetchWithRetry(
          `/api/notifications?${selectedClinic !== "all" ? `directorId=${selectedClinic}` : ""}`,
        )
        const notifData = await notifResponse.json()
        
        await new Promise((resolve) => setTimeout(resolve, 200))
        
        const meetingResponse = await fetchWithRetry("/api/meeting-requests?status=pending")
        const meetingData = await meetingResponse.json()

        // Map meeting requests to notification format
        const meetingNotifs: Notification[] = (meetingData.requests || []).map((m: any) => ({
          id: `meeting-${m.id}`,
          type: "meeting_request" as const,
          title: `Meeting Request: ${m.subject}`,
          message: m.message || `${m.studentName} has requested a meeting`,
          student_id: m.studentId,
          student_name: m.studentName,
          student_email: m.studentEmail,
          clinic: m.clinic,
          is_read: false,
          created_at: m.createdAt,
        }))

        // Combine and sort by date
        const allNotifications = [...(notifData.notifications || []), ...meetingNotifs].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )

        setNotifications(allNotifications)
        setMeetingRequests(meetingData.requests || [])
      } catch (error) {
        console.error("Error fetching notifications:", error)
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [selectedClinic])

  const markAsRead = async (notificationId: string) => {
    // Don't try to update meeting requests in notifications table
    if (notificationId.startsWith("meeting-")) {
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
      return
    }

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notificationId, is_read: true }),
      })

      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
    } catch (error) {
      // Update local state even if API fails
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
    }
  }

  const handleMeetingAction = async (requestId: string, action: "approved" | "declined") => {
    try {
      await fetch("/api/meeting-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: requestId, status: action }),
      })

      // Remove from notifications
      setNotifications((prev) => prev.filter((n) => n.id !== `meeting-${requestId}`))
      setMeetingRequests((prev) => prev.filter((m) => m.id !== requestId))
      setSelectedNotification(null)
    } catch (error) {
      console.error("Error updating meeting request:", error)
    }
  }

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "document_upload":
        return <FileText className="h-4 w-4" />
      case "question":
      case "debrief_question":
        return <HelpCircle className="h-4 w-4" />
      case "meeting_request":
        return <Users className="h-4 w-4" />
      case "announcement":
        return <Calendar className="h-4 w-4" />
      case "debrief_submitted":
      case "debrief":
        return <FileText className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case "document_upload":
        return "bg-blue-100 text-blue-700 border-l-4 border-l-blue-500"
      case "question":
      case "debrief_question":
        return "bg-orange-100 text-orange-700 border-l-4 border-l-orange-500"
      case "meeting_request":
        return "bg-purple-100 text-purple-700 border-l-4 border-l-purple-500"
      case "announcement":
        return "bg-amber-100 text-amber-700 border-l-4 border-l-amber-500"
      case "debrief_submitted":
      case "debrief":
        return "bg-green-100 text-green-700 border-l-4 border-l-green-500"
      default:
        return "bg-gray-100 text-gray-700 border-l-4 border-l-gray-500"
    }
  }

  const getIconBg = (type: NotificationType) => {
    switch (type) {
      case "document_upload":
        return "bg-blue-100 text-blue-700"
      case "question":
      case "debrief_question":
        return "bg-orange-100 text-orange-700"
      case "meeting_request":
        return "bg-purple-100 text-purple-700"
      case "announcement":
        return "bg-amber-100 text-amber-700"
      case "debrief_submitted":
      case "debrief":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getCategoryLabel = (type: NotificationType) => {
    switch (type) {
      case "document_upload":
        return "Documents"
      case "question":
        return "Questions"
      case "debrief_question":
        return "Questions"
      case "meeting_request":
        return "Meetings"
      case "announcement":
        return "Announcements"
      case "debrief_submitted":
      case "debrief":
        return "Debriefs"
      default:
        return "Other"
    }
  }

  // Filter notifications by category
  const filterByCategory = (category: TabCategory) => {
    if (category === "all") return notifications
    if (category === "documents") return notifications.filter((n) => n.type === "document_upload")
    if (category === "questions") return notifications.filter((n) => n.type === "question" || n.type === "debrief_question")
    if (category === "meetings") return notifications.filter((n) => n.type === "meeting_request")
    if (category === "debriefs") return notifications.filter((n) => n.type === "debrief_submitted" || n.type === "debrief")
    if (category === "announcements") return notifications.filter((n) => n.type === "announcement")
    return notifications
  }

  // Count by category
  const documentCount = notifications.filter((n) => n.type === "document_upload").length
  const questionCount = notifications.filter((n) => n.type === "question" || n.type === "debrief_question").length
  const meetingCount = notifications.filter((n) => n.type === "meeting_request").length
  const debriefCount = notifications.filter((n) => n.type === "debrief_submitted" || n.type === "debrief").length
  const announcementCount = notifications.filter((n) => n.type === "announcement").length

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const filteredNotifications = filterByCategory(activeTab)

  if (loading) {
    return (
      <Card className="w-full bg-gradient-to-br from-stone-50 to-stone-100 border-stone-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-[#002855]" />
            <CardTitle className="text-lg text-[#002855]">Triage</CardTitle>
          </div>
          <CardDescription>Your consolidated to-do list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderNotificationItem = (notification: Notification) => (
    <div
      key={notification.id}
      className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${getTypeColor(notification.type)} ${
        !notification.is_read ? "bg-opacity-100" : "bg-opacity-50"
      }`}
      onClick={() => {
        setSelectedNotification(notification)
        if (!notification.is_read) {
          markAsRead(notification.id)
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${getIconBg(notification.type)}`}>{getIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[#002855]">{notification.title}</p>
            <Badge variant="outline" className="h-5 px-1.5 text-xs bg-white/80">
              {getCategoryLabel(notification.type)}
            </Badge>
          </div>
          <p className="text-xs text-[#002855]/70 mt-1 line-clamp-1">{notification.message}</p>
          <div className="flex items-center gap-2 mt-2">
            {notification.student_name && (
              <span className="text-xs text-[#002855]/60">From: {notification.student_name}</span>
            )}
            {notification.clinic && (
              <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                {notification.clinic}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {notification.type === "meeting_request" && notification.id.startsWith("meeting-") ? (
            <Button size="sm" variant="outline" className="h-7 text-xs bg-white/80">
              Respond
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="h-7 text-xs bg-white/80">
              View
            </Button>
          )}
          <ChevronRight className="h-4 w-4 text-[#002855]/40" />
        </div>
      </div>
    </div>
  )

  return (
    <>
      <Card className="w-full bg-gradient-to-br from-stone-50 to-stone-100 border-stone-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-[#002855]" />
              <CardTitle className="text-lg text-[#002855]">Triage</CardTitle>
              {notifications.length > 0 && (
                <Badge className="bg-[#002855] text-white h-5 px-1.5 text-xs">{notifications.length}</Badge>
              )}
            </div>
          </div>
          <CardDescription className="text-[#002855]/60">Your consolidated to-do list</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabCategory)} className="w-full">
            <TabsList className="w-full grid grid-cols-6 bg-stone-200/50">
              <TabsTrigger value="all" className="text-xs data-[state=active]:bg-white">
                All
                {notifications.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {notifications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs data-[state=active]:bg-white">
                Documents
                {documentCount > 0 && (
                  <Badge className="ml-1 h-4 px-1 text-xs bg-blue-500 text-white">{documentCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="questions" className="text-xs data-[state=active]:bg-white">
                Questions
                {questionCount > 0 && (
                  <Badge className="ml-1 h-4 px-1 text-xs bg-orange-500 text-white">{questionCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="meetings" className="text-xs data-[state=active]:bg-white">
                Meetings
                {meetingCount > 0 && (
                  <Badge className="ml-1 h-4 px-1 text-xs bg-purple-500 text-white">{meetingCount}</Badge>
                )}
              </TabsTrigger>
 <TabsTrigger value="debriefs" className="text-xs data-[state=active]:bg-white">
  Debriefs
  {debriefCount > 0 && (
  <Badge className="ml-1 h-4 px-1 text-xs bg-green-500 text-white">{debriefCount}</Badge>
  )}
  </TabsTrigger>
  <TabsTrigger value="announcements" className="text-xs data-[state=active]:bg-white">
  Updates
  {announcementCount > 0 && (
  <Badge className="ml-1 h-4 px-1 text-xs bg-amber-500 text-white">{announcementCount}</Badge>
  )}
  </TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Inbox className="h-8 w-8 mx-auto text-[#002855]/30 mb-2" />
              <p className="text-sm text-[#002855]/50">No {activeTab === "all" ? "" : activeTab} notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.slice(0, compact ? 5 : undefined).map(renderNotificationItem)}
              {compact && filteredNotifications.length > 5 && (
                <Button variant="ghost" size="sm" className="w-full text-[#002855]" onClick={() => {}}>
                  View all {filteredNotifications.length} notifications
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotification && getIcon(selectedNotification.type)}
              {selectedNotification?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedNotification?.student_email && `From: ${selectedNotification.student_email}`}
              {selectedNotification?.clinic && ` • ${selectedNotification.clinic}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">{selectedNotification?.message}</p>

            {selectedNotification?.type === "meeting_request" && selectedNotification.id.startsWith("meeting-") && (
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleMeetingAction(selectedNotification.id.replace("meeting-", ""), "approved")}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                  onClick={() => handleMeetingAction(selectedNotification.id.replace("meeting-", ""), "declined")}
                >
                  <X className="h-3 w-3 mr-1" />
                  Decline
                </Button>
              </div>
            )}

            {selectedNotification?.type !== "meeting_request" && (
              <div className="flex gap-2">
                <Button size="sm" variant="default">
                  <Check className="h-3 w-3 mr-1" />
                  View Details
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedNotification(null)}>
                  <X className="h-3 w-3 mr-1" />
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
