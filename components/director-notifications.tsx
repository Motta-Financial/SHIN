"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, FileText, HelpCircle, Check, X, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Notification = {
  id: string
  type: "document_upload" | "question" | "meeting_request"
  title: string
  message: string
  related_id?: string
  student_id?: string
  student_email?: string
  clinic?: string
  director_id?: string
  is_read: boolean
  created_at: string
}

interface DirectorNotificationsProps {
  selectedClinic: string
  compact?: boolean
}

export function DirectorNotifications({ selectedClinic, compact = false }: DirectorNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [meetingRequests, setMeetingRequests] = useState<any[]>([])

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true)
      try {
        // Fetch notifications from database
        const notifResponse = await fetch(
          `/api/notifications?${selectedClinic !== "all" ? `directorId=${selectedClinic}` : ""}`,
        )
        const notifData = await notifResponse.json()

        // Fetch pending meeting requests
        const meetingResponse = await fetch("/api/meeting-requests?status=pending")
        const meetingData = await meetingResponse.json()

        // Map meeting requests to notification format
        const meetingNotifs: Notification[] = (meetingData.requests || []).map((m: any) => ({
          id: `meeting-${m.id}`,
          type: "meeting_request" as const,
          title: `Meeting Request: ${m.subject}`,
          message: m.message || `${m.studentName} has requested a meeting`,
          student_id: m.studentId,
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

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "document_upload":
        return <FileText className="h-4 w-4" />
      case "question":
        return <HelpCircle className="h-4 w-4" />
      case "meeting_request":
        return <Users className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "document_upload":
        return "bg-blue-100 text-blue-700"
      case "question":
        return "bg-orange-100 text-orange-700"
      case "meeting_request":
        return "bg-purple-100 text-purple-700"
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
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

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No new notifications</p>
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, compact ? 5 : undefined).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                    !notification.is_read ? "bg-muted/30 border-primary/20" : "bg-background"
                  }`}
                  onClick={() => {
                    setSelectedNotification(notification)
                    if (!notification.is_read) {
                      markAsRead(notification.id)
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-md ${getTypeColor(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium truncate">{notification.title}</p>
                        {!notification.is_read && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs flex-shrink-0">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        {notification.clinic && (
                          <Badge variant="outline" className="h-4 px-1 text-xs">
                            {notification.clinic}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {compact && notifications.length > 5 && (
                <Button variant="ghost" size="sm" className="w-full" onClick={() => {}}>
                  View all {notifications.length} notifications
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
