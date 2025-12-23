"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, FileText, HelpCircle, Calendar, Check, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Notification = {
  id: string
  type: "document_upload" | "question" | "meeting_request"
  title: string
  message: string
  related_id: string
  student_name: string
  clinic: string
  is_read: boolean
  created_at: string
}

interface DirectorNotificationsProps {
  selectedClinic: string
  compact?: boolean
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "document_upload",
    title: "SOW Draft Uploaded",
    message: "Sarah Chen uploaded a new Statement of Work draft for review",
    related_id: "doc-1",
    student_name: "Sarah Chen",
    clinic: "Accounting",
    is_read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    type: "question",
    title: "Question about deliverables",
    message: "I'm unsure about the format for the final presentation. Can we discuss?",
    related_id: "q-1",
    student_name: "Michael Rodriguez",
    clinic: "Marketing",
    is_read: false,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    type: "meeting_request",
    title: "Meeting Request",
    message: "Requesting a 30-minute check-in to discuss project timeline",
    related_id: "meet-1",
    student_name: "Jessica Park",
    clinic: "Resource Acquisition", // Changed from "Funding" to "Resource Acquisition"
    is_read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    type: "document_upload",
    title: "Weekly Report Submitted",
    message: "David Kim submitted their weekly progress report",
    related_id: "doc-2",
    student_name: "David Kim",
    clinic: "Consulting",
    is_read: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const directorToClinicMap: Record<string, string> = {
  "Mark Dwyer": "Accounting",
  "Dat Le": "Accounting",
  "Nick Vadala": "Consulting",
  "Ken Mooney": "Resource Acquisition",
  "Christopher Hill": "Marketing",
  "Chris Hill": "Marketing",
  "Beth DiRusso": "Legal",
  "Darrell Mottley": "Legal",
  "Boris Lazic": "SEED",
  "Grace Cha": "SEED",
  "Chaim Letwin": "SEED",
  "Dmitri Tcherevik": "SEED",
}

export function DirectorNotifications({ selectedClinic, compact = false }: DirectorNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true)
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(compact ? 10 : 30)

        if (error) {
          console.error("[v0] Error fetching notifications:", error)
          // Fall back to mock data filtered by clinic
          const clinicName = directorToClinicMap[selectedClinic] || selectedClinic
          const filtered =
            selectedClinic === "all"
              ? mockNotifications
              : mockNotifications.filter((n) => n.clinic.toLowerCase().includes(clinicName.toLowerCase()))
          setNotifications(filtered)
        } else if (data && data.length > 0) {
          // Map Supabase data to Notification type
          const mapped: Notification[] = data.map((n) => ({
            id: n.id,
            type: n.type || "document_upload",
            title: n.title,
            message: n.message,
            related_id: n.related_id || "",
            student_name: n.student_name || "Unknown",
            clinic: n.clinic || "",
            is_read: n.is_read || false,
            created_at: n.created_at,
          }))

          const clinicName = directorToClinicMap[selectedClinic] || selectedClinic
          const filtered =
            selectedClinic === "all"
              ? mapped
              : mapped.filter((n) => {
                  const notificationClinic = (n.clinic || "").toLowerCase()
                  const targetClinic = clinicName.toLowerCase()
                  // Match "Accounting Clinic" with "Accounting" or vice versa
                  return notificationClinic.includes(targetClinic) || targetClinic.includes(notificationClinic)
                })

          setNotifications(filtered)
        } else {
          // No data in Supabase, use mock data
          const clinicName = directorToClinicMap[selectedClinic] || selectedClinic
          const filtered =
            selectedClinic === "all"
              ? mockNotifications
              : mockNotifications.filter((n) => n.clinic.toLowerCase().includes(clinicName.toLowerCase()))
          setNotifications(filtered)
        }
      } catch (error) {
        console.error("[v0] Error in fetchNotifications:", error)
        const clinicName = directorToClinicMap[selectedClinic] || selectedClinic
        const filtered =
          selectedClinic === "all"
            ? mockNotifications
            : mockNotifications.filter((n) => n.clinic.toLowerCase().includes(clinicName.toLowerCase()))
        setNotifications(filtered)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [selectedClinic, compact])

  const markAsRead = async (notificationId: string) => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
    } catch (error) {
      // Update local state even if Supabase fails
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
    }
  }

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "document_upload":
        return <FileText className="h-4 w-4" />
      case "question":
        return <HelpCircle className="h-4 w-4" />
      case "meeting_request":
        return <Calendar className="h-4 w-4" />
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
              From: {selectedNotification?.student_name} • {selectedNotification?.clinic}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">{selectedNotification?.message}</p>
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
