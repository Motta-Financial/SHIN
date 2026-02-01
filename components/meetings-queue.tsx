"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, Users, Play, CheckCircle, MessageSquare, ChevronRight, Calendar } from "lucide-react"
import { fetchWithRetry } from "@/lib/fetch-with-rate-limit"

interface MeetingRequest {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  clinic: string
  subject: string
  message: string
  preferredDates: string[]
  status: "pending" | "in_progress" | "completed" | "cancelled"
  notes: string | null
  debriefNotes: string | null
  clientId: string | null
  clientName: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

interface MeetingsQueueProps {
  weekNumber?: number
}

export function MeetingsQueue({ weekNumber }: MeetingsQueueProps) {
  const [requests, setRequests] = useState<MeetingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showDebriefDialog, setShowDebriefDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<MeetingRequest | null>(null)
  const [debriefNotes, setDebriefNotes] = useState("")

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetchWithRetry("/api/meeting-requests?forQueue=true")
      const data = await res.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error("Error fetching meeting requests:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleStartMeeting = async (request: MeetingRequest) => {
    setUpdating(request.id)
    try {
      const res = await fetch("/api/meeting-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, status: "in_progress" }),
      })
      if (res.ok) {
        await fetchRequests()
      }
    } catch (error) {
      console.error("Error starting meeting:", error)
    } finally {
      setUpdating(null)
    }
  }

  const handleCompleteMeeting = (request: MeetingRequest) => {
    setSelectedRequest(request)
    setDebriefNotes("")
    setShowDebriefDialog(true)
  }

  const handleSubmitDebrief = async () => {
    if (!selectedRequest) return

    setUpdating(selectedRequest.id)
    try {
      const res = await fetch("/api/meeting-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRequest.id,
          status: "completed",
          debriefNotes: debriefNotes.trim() || null,
        }),
      })
      if (res.ok) {
        setShowDebriefDialog(false)
        setSelectedRequest(null)
        setDebriefNotes("")
        await fetchRequests()
      }
    } catch (error) {
      console.error("Error completing meeting:", error)
    } finally {
      setUpdating(null)
    }
  }

  const pendingRequests = requests.filter((r) => r.status === "pending")
  const inProgressRequests = requests.filter((r) => r.status === "in_progress")
  const completedRequests = requests.filter((r) => r.status === "completed")

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const getQueuePosition = (index: number) => {
    if (index === 0) return "Next Up"
    return `#${index + 1} in queue`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* In Progress Section */}
      {inProgressRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="font-semibold text-lg text-foreground">In Progress</h3>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {inProgressRequests.length}
            </Badge>
          </div>
          <div className="grid gap-3">
            {inProgressRequests.map((request) => (
              <Card key={request.id} className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-foreground">{request.clientName || request.studentName}</span>
                        {request.clientName && (
                          <span className="text-sm text-muted-foreground">({request.studentName})</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground">{request.subject}</p>
                      {request.message && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{request.message}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Started {request.startedAt ? formatDate(request.startedAt) : "just now"}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleCompleteMeeting(request)}
                      disabled={updating === request.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Queue Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          <h3 className="font-semibold text-lg text-foreground">Meeting Queue</h3>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {pendingRequests.length}
          </Badge>
        </div>
        
        {pendingRequests.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-muted-foreground">No meetings in queue</p>
              <p className="text-sm text-muted-foreground/70">Students can request meetings from their portal</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {pendingRequests.map((request, index) => (
              <Card
                key={request.id}
                className={index === 0 ? "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            index === 0
                              ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700"
                              : ""
                          }
                        >
                          {getQueuePosition(index)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{request.clinic}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{request.clientName || request.studentName}</span>
                        {request.clientName && (
                          <span className="text-sm text-muted-foreground">({request.studentName})</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground">{request.subject}</p>
                      {request.message && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{request.message}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Requested {formatDate(request.createdAt)}
                        </span>
                        {request.preferredDates && request.preferredDates.length > 0 && (
                          <span>Preferred: {request.preferredDates.join(", ")}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleStartMeeting(request)}
                      disabled={updating === request.id || inProgressRequests.length > 0}
                      variant={index === 0 && inProgressRequests.length === 0 ? "default" : "outline"}
                      className={index === 0 && inProgressRequests.length === 0 ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                    >
                      {updating === request.id ? (
                        "Starting..."
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed Section */}
      {completedRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <h3 className="font-semibold text-lg text-foreground">Completed Today</h3>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {completedRequests.length}
            </Badge>
          </div>
          <div className="grid gap-3">
            {completedRequests.slice(0, 5).map((request) => (
              <Card key={request.id} className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{request.clientName || request.studentName}</span>
                        <span className="text-sm text-muted-foreground">- {request.subject}</span>
                      </div>
                      {request.debriefNotes && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-background rounded-md border">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">{request.debriefNotes}</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Completed {request.completedAt ? formatDate(request.completedAt) : "recently"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Debrief Dialog */}
      <Dialog open={showDebriefDialog} onOpenChange={setShowDebriefDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Meeting Debrief</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedRequest.clientName || selectedRequest.studentName}</p>
                <p className="text-sm text-muted-foreground">{selectedRequest.subject}</p>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="debrief-notes" className="text-sm font-medium">
                Debrief Notes (Optional)
              </label>
              <Textarea
                id="debrief-notes"
                placeholder="Add notes from the meeting that will be shared with the student team..."
                value={debriefNotes}
                onChange={(e) => setDebriefNotes(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                These notes will appear in the student's My Team activity feed and the Client Engagements page.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDebriefDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDebrief}
              disabled={updating === selectedRequest?.id}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {updating === selectedRequest?.id ? "Saving..." : "Complete Meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
