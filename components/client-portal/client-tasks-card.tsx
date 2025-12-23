"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Comment {
  id: string
  comment_text: string
  author_name: string
  author_email: string
  author_type: string
  created_at: string
}

interface Task {
  id: string
  title: string
  description: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high"
  due_date: string | null
  assigned_to: string | null
  created_by: string
  created_at: string
  comments: Comment[]
}

interface ClientTasksCardProps {
  tasks: Task[]
  clientId: string
  clientName: string
  clientEmail: string
  onCommentAdded?: () => void
  loading?: boolean
}

export function ClientTasksCard({
  tasks,
  clientId,
  clientName,
  clientEmail,
  onCommentAdded,
  loading,
}: ClientTasksCardProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<string | null>(null)

  const handleSubmitComment = async (taskId: string) => {
    const text = commentText[taskId]?.trim()
    if (!text) return

    setSubmitting(taskId)
    try {
      const response = await fetch("/api/client-portal/tasks/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          clientId,
          commentText: text,
          authorName: clientName,
          authorEmail: clientEmail,
          authorType: "client",
        }),
      })

      if (response.ok) {
        setCommentText((prev) => ({ ...prev, [taskId]: "" }))
        onCommentAdded?.()
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setSubmitting(null)
    }
  }

  const getStatusBadge = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-300">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        )
      case "cancelled":
        return <Badge className="bg-slate-100 text-slate-600 border-slate-300">Cancelled</Badge>
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  const getPriorityBadge = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-700 border-red-300 text-xs">High</Badge>
      case "low":
        return <Badge className="bg-slate-100 text-slate-600 border-slate-300 text-xs">Low</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-600 border-slate-300 text-xs">Medium</Badge>
    }
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress")
  const completedTasks = tasks.filter((t) => t.status === "completed")

  if (loading) {
    return (
      <Card className="p-5 border-slate-200 bg-white">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
          <ClipboardList className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Tasks & Requests</h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5 border-slate-200 bg-white">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
        <ClipboardList className="h-5 w-5 text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-900">Tasks & Requests</h2>
        <div className="ml-auto flex items-center gap-2">
          {pendingTasks.length > 0 && (
            <Badge className="bg-amber-100 text-amber-700">{pendingTasks.length} Active</Badge>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <ClipboardList className="h-10 w-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No tasks yet</p>
            <p className="text-xs text-slate-400 mt-1">Tasks from your team will appear here</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-lg border transition-colors ${
                task.status === "completed"
                  ? "bg-slate-50 border-slate-200"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3
                        className={`text-sm font-medium ${
                          task.status === "completed" ? "text-slate-500 line-through" : "text-slate-900"
                        }`}
                      >
                        {task.title}
                      </h3>
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                    {task.description && <p className="text-xs text-slate-600 line-clamp-2 mb-2">{task.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {task.assigned_to && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {task.assigned_to}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {task.comments.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {task.comments.length} comment{task.comments.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                    {expandedTask === task.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {expandedTask === task.id && (
                <div className="border-t border-slate-200 p-4 bg-slate-50">
                  {/* Comments Section */}
                  <div className="space-y-3 mb-4">
                    <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide">Comments & Responses</h4>
                    {task.comments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No comments yet. Add your response below.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {task.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className={`p-3 rounded-lg text-sm ${
                              comment.author_type === "client"
                                ? "bg-blue-50 border border-blue-200 ml-4"
                                : "bg-white border border-slate-200 mr-4"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-slate-900">{comment.author_name}</span>
                              <span className="text-xs text-slate-400">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-slate-700">{comment.comment_text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Comment */}
                  {task.status !== "completed" && task.status !== "cancelled" && (
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Add your response..."
                        value={commentText[task.id] || ""}
                        onChange={(e) => setCommentText((prev) => ({ ...prev, [task.id]: e.target.value }))}
                        className="flex-1 min-h-[60px] text-sm resize-none"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSubmitComment(task.id)}
                        disabled={!commentText[task.id]?.trim() || submitting === task.id}
                        className="bg-slate-700 hover:bg-slate-800"
                      >
                        {submitting === task.id ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
