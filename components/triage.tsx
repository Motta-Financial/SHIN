"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  ListTodo,
  Shield,
  Users,
  Calendar,
  BookOpen,
  Inbox,
  Send,
  Building2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

type UserType = "student" | "client" | "director"
type AgreementType = "client-contract" | "student-confidentiality" | "director-confidentiality"

interface TriageItem {
  id: string
  type: "action" | "notification" | "onboarding"
  category: string
  priority: "high" | "medium" | "low"
  title: string
  description: string
  icon: React.ReactNode
  iconBg: string
  action?: () => void
  actionLabel?: string
  metadata?: Record<string, any>
  timestamp?: string
}

interface TriageProps {
  userType: UserType
  userName: string
  userEmail: string
  userId?: string
  clinicId?: string
  clientId?: string
  programName?: string
  // Data props for students
  debriefs?: any[]
  meetingRequests?: any[]
  recentCourseMaterials?: any[]
  studentNotifications?: any[]
  hasSubmittedThisWeek?: boolean
  hasSubmittedLastWeek?: boolean
  currentWeekEnding?: string
  lastWeekEnding?: string
  // Data props for directors
  directorNotifications?: any[]
  selectedClinic?: string
  // Data props for clients
  tasks?: any[]
  questions?: any[]
  // Callbacks
  onNavigate?: (tab: string) => void
  onAgreementSigned?: (type: AgreementType) => void
  signedAgreements?: AgreementType[]
}

const fetchWithRetry = async (url: string, maxRetries = 3): Promise<Response> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url)

      // Check for rate limiting
      if (response.status === 429) {
        const delay = Math.pow(2, attempt + 1) * 1000 // 2s, 4s, 8s
        console.log(`[v0] Triage - Rate limited, retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // Check if response might be rate limit text
      const contentType = response.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        const text = await response.text()
        if (text.startsWith("Too Many R")) {
          const delay = Math.pow(2, attempt + 1) * 1000
          console.log(`[v0] Triage - Rate limited (text), retrying in ${delay}ms...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
        // Try to parse as JSON anyway
        try {
          return new Response(JSON.stringify(JSON.parse(text)), {
            headers: { "content-type": "application/json" },
          })
        } catch {
          throw new Error(`Non-JSON response: ${text.substring(0, 50)}`)
        }
      }

      return response
    } catch (error) {
      if (attempt === maxRetries - 1) throw error
      const delay = Math.pow(2, attempt + 1) * 1000
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw new Error("Max retries exceeded")
}

export function Triage({
  userType,
  userName,
  userEmail,
  userId,
  clinicId,
  clientId,
  programName = "SEED Program",
  debriefs = [],
  meetingRequests = [],
  recentCourseMaterials = [],
  studentNotifications = [],
  hasSubmittedThisWeek = true,
  hasSubmittedLastWeek = true,
  currentWeekEnding = "",
  lastWeekEnding = "",
  directorNotifications = [],
  selectedClinic = "all",
  tasks = [],
  questions = [],
  onNavigate,
  onAgreementSigned,
  signedAgreements = [],
}: TriageProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [showAgreementDialog, setShowAgreementDialog] = useState(false)
  const [selectedAgreement, setSelectedAgreement] = useState<AgreementType | null>(null)
  const [signature, setSignature] = useState("")
  const [clinicName, setClinicName] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch notifications for directors
  useEffect(() => {
    if (userType === "director") {
      fetchDirectorNotifications()
    } else {
      setLoading(false)
    }
  }, [userType, selectedClinic])

  const fetchDirectorNotifications = async () => {
    setLoading(true)
    try {
      // Add initial delay to avoid collision with other components
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Fetch notifications first with retry
      const notifResponse = await fetchWithRetry(
        `/api/notifications?${selectedClinic !== "all" ? `directorId=${selectedClinic}` : ""}`,
      )
      const notifData = await notifResponse.json()

      // Add delay between requests
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Then fetch meeting requests with retry
      const meetingResponse = await fetchWithRetry("/api/meeting-requests?status=pending")
      const meetingData = await meetingResponse.json()

      const meetingNotifs = (meetingData.requests || []).map((m: any) => ({
        id: `meeting-${m.id}`,
        type: "meeting_request",
        title: `Meeting Request: ${m.subject}`,
        message: m.message || `${m.studentName} has requested a meeting`,
        student_id: m.studentId,
        student_email: m.studentEmail,
        clinic: m.clinic,
        is_read: false,
        created_at: m.createdAt,
      }))

      setNotifications(
        [...(notifData.notifications || []), ...meetingNotifs].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      )
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Build triage items based on user type
  const buildTriageItems = (): TriageItem[] => {
    const items: TriageItem[] = []

    // Onboarding items (unsigned agreements)
    const requiredAgreement =
      userType === "student"
        ? "student-confidentiality"
        : userType === "client"
          ? "client-contract"
          : "director-confidentiality"

    if (!signedAgreements.includes(requiredAgreement as AgreementType)) {
      items.push({
        id: `onboarding-${requiredAgreement}`,
        type: "onboarding",
        category: "Onboarding",
        priority: "high",
        title:
          userType === "student"
            ? "Sign Confidentiality Agreement"
            : userType === "client"
              ? "Sign Client Engagement Agreement"
              : "Sign Director Confidentiality Agreement",
        description: "Required before accessing all features",
        icon: <Shield className="h-4 w-4" />,
        iconBg: "bg-amber-100 text-amber-700",
        action: () => {
          setSelectedAgreement(requiredAgreement as AgreementType)
          setShowAgreementDialog(true)
        },
        actionLabel: "Sign Now",
      })
    }

    // Student-specific items
    if (userType === "student") {
      // Monday attendance reminder for today's class at 5:00 PM
      const today = new Date()
      const isMonday = today.getDay() === 1

      if (isMonday) {
        items.push({
          id: "action-attendance-monday",
          type: "action",
          category: "Attendance",
          priority: "high",
          title: "Submit Attendance for Today's Class",
          description:
            "Class is at 5:00 PM today - Don't forget to mark your attendance using the password shared in class",
          icon: <Bell className="h-4 w-4" />,
          iconBg: "bg-blue-100 text-blue-700",
          action: () => onNavigate?.("attendance"),
          actionLabel: "Submit Now",
        })
      }

      // Missing debriefs
      if (!hasSubmittedThisWeek) {
        items.push({
          id: "action-debrief-current",
          type: "action",
          category: "Debriefs",
          priority: "high",
          title: "Submit Weekly Debrief",
          description: `Week ending ${currentWeekEnding ? new Date(currentWeekEnding).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "this week"} - Log your hours and work summary`,
          icon: <AlertTriangle className="h-4 w-4" />,
          iconBg: "bg-red-100 text-red-700",
          action: () => onNavigate?.("attendance"),
          actionLabel: "Submit",
        })
      }

      if (!hasSubmittedLastWeek) {
        items.push({
          id: "action-debrief-overdue",
          type: "action",
          category: "Debriefs",
          priority: "high",
          title: "Overdue: Last Week's Debrief",
          description: `Week ending ${lastWeekEnding ? new Date(lastWeekEnding).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "last week"} - Please submit ASAP`,
          icon: <Clock className="h-4 w-4" />,
          iconBg: "bg-amber-100 text-amber-700",
          action: () => onNavigate?.("attendance"),
          actionLabel: "Submit",
        })
      }

      // Answered questions
      debriefs
        .filter((d) => d.questions && d.status === "reviewed")
        .slice(0, 3)
        .forEach((debrief) => {
          items.push({
            id: `notification-question-${debrief.id}`,
            type: "notification",
            category: "Questions",
            priority: "low",
            title: "Question Answered",
            description: debrief.questions,
            icon: <CheckCircle2 className="h-4 w-4" />,
            iconBg: "bg-green-100 text-green-700",
            action: () => onNavigate?.("questions"),
            timestamp: debrief.created_at,
          })
        })

      // Meeting requests
      meetingRequests
        .filter((m) => m.status === "pending")
        .forEach((meeting) => {
          items.push({
            id: `notification-meeting-${meeting.id}`,
            type: "notification",
            category: "Meetings",
            priority: "medium",
            title: "Meeting Request Pending",
            description: meeting.subject,
            icon: <Clock className="h-4 w-4" />,
            iconBg: "bg-amber-100 text-amber-700",
            timestamp: meeting.createdAt,
          })
        })

      meetingRequests
        .filter((m) => m.status === "scheduled")
        .forEach((meeting) => {
          items.push({
            id: `notification-meeting-scheduled-${meeting.id}`,
            type: "notification",
            category: "Meetings",
            priority: "low",
            title: "Meeting Scheduled",
            description: meeting.subject,
            icon: <Calendar className="h-4 w-4" />,
            iconBg: "bg-blue-100 text-blue-700",
            timestamp: meeting.createdAt,
          })
        })

      // Course materials
      recentCourseMaterials.slice(0, 3).forEach((material) => {
        items.push({
          id: `notification-material-${material.id}`,
          type: "notification",
          category: "Materials",
          priority: "low",
          title: "New Course Material",
          description: material.title,
          icon: <BookOpen className="h-4 w-4" />,
          iconBg: "bg-purple-100 text-purple-700",
          action: () => window.open(material.file_url, "_blank"),
          actionLabel: "View",
          timestamp: material.created_at,
        })
      })

      // Student notifications/announcements
      studentNotifications.forEach((notif) => {
        items.push({
          id: `notification-announcement-${notif.id}`,
          type: "notification",
          category: "Announcements",
          priority: notif.priority === "high" ? "high" : "medium",
          title: notif.title,
          description: notif.message,
          icon: <Bell className="h-4 w-4" />,
          iconBg: "bg-purple-100 text-purple-700",
          timestamp: notif.created_at,
          metadata: { from: notif.created_by },
        })
      })
    }

    // Director-specific items
    if (userType === "director") {
      notifications.forEach((notif) => {
        const iconMap: Record<string, React.ReactNode> = {
          document_upload: <FileText className="h-4 w-4" />,
          question: <HelpCircle className="h-4 w-4" />,
          meeting_request: <Users className="h-4 w-4" />,
        }
        const bgMap: Record<string, string> = {
          document_upload: "bg-blue-100 text-blue-700",
          question: "bg-orange-100 text-orange-700",
          meeting_request: "bg-purple-100 text-purple-700",
        }

        items.push({
          id: `notification-${notif.id}`,
          type: "notification",
          category:
            notif.type === "meeting_request" ? "Meetings" : notif.type === "question" ? "Questions" : "Documents",
          priority: notif.is_read ? "low" : "medium",
          title: notif.title,
          description: notif.message,
          icon: iconMap[notif.type] || <Bell className="h-4 w-4" />,
          iconBg: bgMap[notif.type] || "bg-gray-100 text-gray-700",
          timestamp: notif.created_at,
          metadata: {
            clinic: notif.clinic,
            studentEmail: notif.student_email,
            isRead: notif.is_read,
            originalId: notif.id,
          },
        })
      })
    }

    // Client-specific items
    if (userType === "client") {
      // Pending tasks
      tasks
        .filter((t) => t.status === "pending" || t.status === "in_progress")
        .forEach((task) => {
          items.push({
            id: `action-task-${task.id}`,
            type: "action",
            category: "Tasks",
            priority: task.priority === "high" ? "high" : "medium",
            title: task.title,
            description: task.description || "Task assigned to your team",
            icon: <ListTodo className="h-4 w-4" />,
            iconBg: task.status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700",
            metadata: { status: task.status, assignee: task.assignee },
          })
        })

      // Unanswered questions
      questions
        .filter((q) => !q.answer)
        .forEach((question) => {
          items.push({
            id: `notification-question-${question.id}`,
            type: "notification",
            category: "Questions",
            priority: "medium",
            title: "Awaiting Response",
            description: question.question,
            icon: <HelpCircle className="h-4 w-4" />,
            iconBg: "bg-orange-100 text-orange-700",
            timestamp: question.created_at,
          })
        })

      // Answered questions
      questions
        .filter((q) => q.answer)
        .slice(0, 3)
        .forEach((question) => {
          items.push({
            id: `notification-answered-${question.id}`,
            type: "notification",
            category: "Questions",
            priority: "low",
            title: "Question Answered",
            description: question.question,
            icon: <CheckCircle2 className="h-4 w-4" />,
            iconBg: "bg-green-100 text-green-700",
            timestamp: question.answered_at,
            metadata: { answer: question.answer },
          })
        })
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }

  const triageItems = buildTriageItems()

  const filteredItems = activeTab === "all" ? triageItems : triageItems.filter((item) => item.type === activeTab)

  const actionCount = triageItems.filter((i) => i.type === "action").length
  const notificationCount = triageItems.filter((i) => i.type === "notification").length
  const onboardingCount = triageItems.filter((i) => i.type === "onboarding").length

  const handleSignAgreement = async () => {
    if (!signature.trim() || !selectedAgreement || !agreedToTerms) return
    if (
      (selectedAgreement === "student-confidentiality" || selectedAgreement === "director-confidentiality") &&
      !clinicName.trim()
    )
      return

    try {
      await fetch("/api/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agreementType: selectedAgreement,
          userName,
          userEmail,
          userType,
          signature: signature.trim(),
          clinicName: clinicName.trim(),
          signedAt: new Date().toISOString(),
          programName,
        }),
      })

      onAgreementSigned?.(selectedAgreement)
      setShowAgreementDialog(false)
      setSignature("")
      setClinicName("")
      setAgreedToTerms(false)
      setSelectedAgreement(null)
    } catch (error) {
      console.error("Error signing agreement:", error)
    }
  }

  useEffect(() => {
    if (!showAgreementDialog) {
      setSignature("")
      setClinicName("")
      setAgreedToTerms(false)
    }
  }, [showAgreementDialog])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500"
      case "medium":
        return "border-l-amber-500"
      default:
        return "border-l-green-500"
    }
  }

  const getAgreementContent = () => {
    if (selectedAgreement === "student-confidentiality" || selectedAgreement === "director-confidentiality") {
      return {
        title: "SUFFOLK UNIVERSITY\nSEED PROGRAM\nCONFIDENTIALITY AGREEMENT",
        sections: [
          {
            text: 'Due to your access to confidential information, all faculty and students Participating in SEED programs must sign this agreement. "Confidential information" means any information of a secret or confidential nature relating to the workplace. All such information should be labeled or marked as "confidential" by the client.',
          },
          {
            text: "Confidential information may include, but is not limited to, the following: trade secrets, proprietary information, customer information, customer lists, methods, plans, documents, data, drawings, manuals, notebooks, reports, models, inventions, formulas, processes, software, information systems, contracts, negotiations, strategic planning, proposals, business alliances, and training materials.",
          },
          {
            heading: "In connection with my participation in this SEED program, I agree to the following:",
          },
          {
            text: 'I have read and understand the above definition of "confidential information." I agree that I will not at any time, both during and after my enrollment in a SEED, communicate or disclose confidential information to any person, corporation, or entity.',
            isItalic: true,
          },
          {
            text: "I further recognize and agree that while in SEED I may become aware of nonpublic information of a personal nature about employees or associates, including, without limitation, actions, omissions, statements, or personally identifiable medical, family, financial, social, behavioral, or other personal or private information. I will not disclose any such information that I learn in SEED to any other person or entity, unless required by applicable law or legal process.",
            isItalic: true,
          },
        ],
        signatureFields: ["Name (Student/Faculty)", "Program Name (Clinic)", "Signature", "Date"],
      }
    } else if (selectedAgreement === "client-contract") {
      return {
        title: "SUFFOLK UNIVERSITY\nSEED PROGRAM\nCLIENT ENGAGEMENT AGREEMENT",
        sections: [
          {
            text: "This Client Engagement Agreement establishes the terms and conditions for participation in the Suffolk University SEED (Small Enterprise Economic Development) Program.",
          },
          {
            text: "By signing this agreement, you acknowledge and agree to the following terms:",
          },
          {
            text: "1. You will provide accurate and complete information about your business and its operations to support the student consulting engagement.",
            isItalic: true,
          },
          {
            text: "2. You understand that students are learning consultants and their recommendations are advisory in nature.",
            isItalic: true,
          },
          {
            text: "3. You agree to maintain professional communication with student teams and program directors.",
            isItalic: true,
          },
          {
            text: "4. You will provide timely feedback on deliverables and attend scheduled meetings as agreed upon.",
            isItalic: true,
          },
        ],
        signatureFields: ["Organization Name", "Authorized Representative", "Signature", "Date"],
      }
    }
    return null
  }

  const agreementContent = getAgreementContent()

  if (loading && userType === "director") {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Triage
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
            <div>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-primary" />
                Triage
                {triageItems.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {triageItems.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Your consolidated to-do list</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="text-xs">
                All
                {triageItems.length > 0 && (
                  <Badge variant="outline" className="ml-1 h-5 px-1">
                    {triageItems.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="onboarding" className="text-xs">
                Setup
                {onboardingCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1">
                    {onboardingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="action" className="text-xs">
                Actions
                {actionCount > 0 && <Badge className="ml-1 h-5 px-1 bg-amber-500">{actionCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="notification" className="text-xs">
                Updates
                {notificationCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1">
                    {notificationCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                    <p className="font-medium text-green-700">All caught up!</p>
                    <p className="text-sm text-muted-foreground">No pending items in your triage</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredItems.map((item) => (
                      <Collapsible
                        key={item.id}
                        open={expandedItems.has(item.id)}
                        onOpenChange={() => toggleExpanded(item.id)}
                      >
                        <div
                          className={`p-3 rounded-lg border border-l-4 ${getPriorityColor(item.priority)} bg-card hover:bg-muted/50 transition-colors`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-md ${item.iconBg}`}>{item.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium text-sm">{item.title}</p>
                                    <Badge variant="outline" className="h-5 px-1.5 text-xs">
                                      {item.category}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                    {item.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {item.action && item.actionLabel && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs bg-transparent"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        item.action?.()
                                      }}
                                    >
                                      {item.actionLabel}
                                    </Button>
                                  )}
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                      {expandedItems.has(item.id) ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </CollapsibleTrigger>
                                </div>
                              </div>
                              {item.timestamp && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                                </p>
                              )}
                            </div>
                          </div>
                          <CollapsibleContent className="mt-3 pt-3 border-t">
                            <div className="text-sm text-muted-foreground space-y-2">
                              <p>{item.description}</p>
                              {item.metadata && (
                                <div className="flex flex-wrap gap-2">
                                  {item.metadata.clinic && <Badge variant="outline">{item.metadata.clinic}</Badge>}
                                  {item.metadata.from && <span className="text-xs">From: {item.metadata.from}</span>}
                                  {item.metadata.status && <Badge variant="secondary">{item.metadata.status}</Badge>}
                                  {item.metadata.answer && (
                                    <div className="w-full mt-2 p-2 bg-green-50 rounded border border-green-200">
                                      <p className="text-xs font-medium text-green-800">Answer:</p>
                                      <p className="text-xs text-green-700">{item.metadata.answer}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showAgreementDialog} onOpenChange={setShowAgreementDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {selectedAgreement === "client-contract" ? "Client Engagement Agreement" : "Confidentiality Agreement"}
            </DialogTitle>
            <DialogDescription>Please read the agreement carefully before signing</DialogDescription>
          </DialogHeader>

          {agreementContent && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Agreement Document */}
              <ScrollArea className="flex-1 border rounded-lg bg-white p-6 my-4">
                <div className="max-w-xl mx-auto">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      <Building2 className="h-10 w-10 text-primary" />
                    </div>
                    {agreementContent.title.split("\n").map((line, i) => (
                      <p key={i} className={`font-bold ${i === 0 ? "text-lg" : "text-base"}`}>
                        {line}
                      </p>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Agreement Content */}
                  <div className="space-y-4 text-sm leading-relaxed">
                    {agreementContent.sections.map((section, i) => (
                      <div key={i}>
                        {section.heading && <p className="font-semibold underline mb-2">{section.heading}</p>}
                        {section.text && <p className={section.isItalic ? "italic" : ""}>{section.text}</p>}
                      </div>
                    ))}
                  </div>

                  <Separator className="my-6" />

                  {/* Signature Section */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-semibold italic">
                        Name ({userType === "client" ? "Authorized Representative" : "Student/Faculty"}):
                      </Label>
                      <Input
                        id="name"
                        value={signature}
                        onChange={(e) => setSignature(e.target.value)}
                        placeholder="Type your full legal name"
                        className="border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent"
                      />
                    </div>

                    {(selectedAgreement === "student-confidentiality" ||
                      selectedAgreement === "director-confidentiality") && (
                      <div className="space-y-2">
                        <Label htmlFor="clinic" className="font-semibold italic">
                          Program Name (Clinic):
                        </Label>
                        <Input
                          id="clinic"
                          value={clinicName}
                          onChange={(e) => setClinicName(e.target.value)}
                          placeholder="e.g., Accounting Clinic, Marketing Clinic"
                          className="border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent"
                        />
                      </div>
                    )}

                    {selectedAgreement === "client-contract" && (
                      <div className="space-y-2">
                        <Label htmlFor="org" className="font-semibold italic">
                          Organization Name:
                        </Label>
                        <Input
                          id="org"
                          value={clinicName}
                          onChange={(e) => setClinicName(e.target.value)}
                          placeholder="Your organization name"
                          className="border-b-2 border-t-0 border-x-0 rounded-none focus:ring-0 bg-transparent"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="font-semibold italic">Signature:</Label>
                      <div className="h-12 border-b-2 border-gray-400 flex items-end pb-1">
                        {signature && <span className="text-2xl font-script italic text-gray-700">{signature}</span>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-semibold italic">Date:</Label>
                      <p className="border-b-2 border-gray-400 pb-1">
                        {new Date().toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Agreement Checkbox */}
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Checkbox
                  id="agree"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                />
                <Label htmlFor="agree" className="text-sm leading-relaxed cursor-pointer">
                  I have read and understand the above agreement. I agree to all terms and conditions stated herein. I
                  understand that this is a legally binding electronic signature.
                </Label>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAgreementDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSignAgreement}
              disabled={
                !signature.trim() ||
                !agreedToTerms ||
                ((selectedAgreement === "student-confidentiality" ||
                  selectedAgreement === "director-confidentiality" ||
                  selectedAgreement === "client-contract") &&
                  !clinicName.trim())
              }
            >
              <Send className="h-4 w-4 mr-2" />
              Sign Agreement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
