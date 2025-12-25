"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MessageSquare,
  ClipboardList,
  HelpCircle,
  Plus,
  Send,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  User,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { DiscussionBoard } from "./discussion-board"

interface Task {
  id: string
  title: string
  description: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high"
  due_date: string | null
  assigned_to: string | null
  created_by: string
  created_by_type: string
  created_at: string
  comments: Comment[]
  attachments?: { name: string; url: string }[]
}

interface Comment {
  id: string
  comment_text: string
  author_name: string
  author_email: string
  author_type: string
  created_at: string
  attachments?: { name: string; url: string }[]
}

interface Question {
  id: string
  question: string
  answer: string | null
  asked_by: string
  asked_by_email: string
  answered_by: string | null
  answered_at: string | null
  status: "open" | "answered" | "closed"
  category: string
  created_at: string
}

interface ClientServiceTabProps {
  clientId: string
  clientName: string
  currentUser: {
    id: string
    name: string
    email: string
    type: "student" | "director" | "client"
  }
  teamMembers?: { id: string; name: string; email: string }[]
}

export function ClientServiceTab({ clientId, clientName, currentUser, teamMembers = [] }: ClientServiceTabProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("discussion")
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [showNewQuestion, setShowNewQuestion] = useState(false)

  // New task form
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState("medium")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  const [newTaskAssignee, setNewTaskAssignee] = useState("")

  // New question form
  const [newQuestion, setNewQuestion] = useState("")
  const [newQuestionCategory, setNewQuestionCategory] = useState("general")

  // Comments
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [clientId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tasksRes, questionsRes] = await Promise.all([
        fetch(`/api/client-portal/tasks?clientId=${clientId}`),
        fetch(`/api/client-portal/questions?clientId=${clientId}`),
      ])
      const [tasksData, questionsData] = await Promise.all([tasksRes.json(), questionsRes.json()])
      setTasks(tasksData.tasks || [])
      setQuestions(questionsData.questions || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/client-portal/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          title: newTaskTitle,
          description: newTaskDescription,
          priority: newTaskPriority,
          dueDate: newTaskDueDate || null,
          assignedTo: newTaskAssignee || null,
          createdBy: currentUser.name,
          createdByType: currentUser.type,
        }),
      })
      if (res.ok) {
        setNewTaskTitle("")
        setNewTaskDescription("")
        setNewTaskPriority("medium")
        setNewTaskDueDate("")
        setNewTaskAssignee("")
        setShowNewTask(false)
        fetchData()
      }
    } catch (error) {
      console.error("Error creating task:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateQuestion = async () => {
    if (!newQuestion.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/client-portal/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          question: newQuestion,
          askedBy: currentUser.name,
          askedByEmail: currentUser.email,
          category: newQuestionCategory,
        }),
      })
      if (res.ok) {
        setNewQuestion("")
        setNewQuestionCategory("general")
        setShowNewQuestion(false)
        fetchData()
      }
    } catch (error) {
      console.error("Error creating question:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddComment = async (taskId: string) => {
    const text = commentText[taskId]?.trim()
    if (!text) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/client-portal/tasks/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          clientId,
          commentText: text,
          authorName: currentUser.name,
          authorEmail: currentUser.email,
          authorType: currentUser.type,
        }),
      })
      if (res.ok) {
        setCommentText((prev) => ({ ...prev, [taskId]: "" }))
        fetchData()
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, newStatus: Task["status"]) => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/client-portal/tasks/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          status: newStatus,
          updatedBy: currentUser.name,
          updatedByType: currentUser.type,
        }),
      })
      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error updating task status:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    if (!answer.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/client-portal/questions/answer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          answer: answer.trim(),
          answeredBy: currentUser.name,
        }),
      })
      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error answering question:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        )
      case "cancelled":
        return <Badge className="bg-slate-100 text-slate-600">Cancelled</Badge>
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  const getPriorityBadge = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-700 text-xs">High</Badge>
      case "low":
        return <Badge className="bg-slate-100 text-slate-600 text-xs">Low</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-600 text-xs">Medium</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discussion" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Discussion
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Requests
            {tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length > 0 && (
              <Badge className="ml-1 bg-amber-500 text-white text-xs">
                {tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Q&A
            {questions.filter((q) => q.status === "open").length > 0 && (
              <Badge className="ml-1 bg-amber-500 text-white text-xs">
                {questions.filter((q) => q.status === "open").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Discussion Tab */}
        <TabsContent value="discussion" className="mt-4">
          <DiscussionBoard
            contextType="client"
            contextId={clientId}
            currentUser={currentUser}
            title={`${clientName} Discussion`}
            description="Team discussions, updates, and collaboration"
          />
        </TabsContent>

        {/* Tasks/Requests Tab */}
        <TabsContent value="tasks" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="h-5 w-5" />
                    Client Requests
                  </CardTitle>
                  <CardDescription>Tasks and requests for the client team</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowNewTask(!showNewTask)}
                  className="bg-slate-700 hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Request
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New Task Form */}
              {showNewTask && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                  <h4 className="font-medium text-slate-900">Create New Request</h4>
                  <Input
                    placeholder="Request title..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="bg-white"
                  />
                  <Textarea
                    placeholder="Description..."
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    className="bg-white min-h-[80px]"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="bg-white"
                      placeholder="Due date"
                    />
                    <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Assign to" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.name}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowNewTask(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleCreateTask} disabled={submitting || !newTaskTitle.trim()}>
                      <Send className="h-4 w-4 mr-1" />
                      Create
                    </Button>
                  </div>
                </div>
              )}

              {/* Tasks List */}
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-lg">
                      <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                      <div className="h-3 bg-slate-200 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <ClipboardList className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No requests yet</p>
                  <p className="text-xs text-slate-400 mt-1">Create a request for the client team</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="border border-slate-200 rounded-lg overflow-hidden">
                      <div
                        className="p-4 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="font-medium text-slate-900">{task.title}</h4>
                              {getStatusBadge(task.status)}
                              {getPriorityBadge(task.priority)}
                            </div>
                            {task.description && (
                              <p className="text-sm text-slate-600 line-clamp-2 mb-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>by {task.created_by}</span>
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
                                  {task.comments.length}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            {expandedTask === task.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {expandedTask === task.id && (
                        <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-4">
                          {/* Comments */}
                          {task.comments.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Comments</p>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {task.comments.map((comment) => (
                                  <div
                                    key={comment.id}
                                    className={`p-3 rounded-lg text-sm ${
                                      comment.author_type === currentUser.type
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
                            </div>
                          )}

                          {/* Add Comment */}
                          {task.status !== "completed" && task.status !== "cancelled" && (
                            <div className="flex gap-2">
                              <Textarea
                                placeholder="Add a comment..."
                                value={commentText[task.id] || ""}
                                onChange={(e) => setCommentText((prev) => ({ ...prev, [task.id]: e.target.value }))}
                                className="flex-1 min-h-[60px] text-sm resize-none bg-white"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleAddComment(task.id)}
                                disabled={!commentText[task.id]?.trim() || submitting}
                                className="bg-slate-700 hover:bg-slate-800"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          )}

                          {/* Director-specific features */}
                          {currentUser.type === "director" && (
                            <div className="flex gap-2">
                              <Select
                                value={task.status}
                                onValueChange={(newStatus) => handleUpdateTaskStatus(task.id, newStatus)}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <HelpCircle className="h-5 w-5" />
                    Questions & Answers
                  </CardTitle>
                  <CardDescription>Ask questions and get answers from the team</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowNewQuestion(!showNewQuestion)}
                  className="bg-slate-700 hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ask Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New Question Form */}
              {showNewQuestion && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                  <h4 className="font-medium text-slate-900">Ask a Question</h4>
                  <Select value={newQuestionCategory} onValueChange={setNewQuestionCategory}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="project">Project Scope</SelectItem>
                      <SelectItem value="timeline">Timeline</SelectItem>
                      <SelectItem value="deliverables">Deliverables</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Type your question..."
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className="bg-white min-h-[80px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowNewQuestion(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleCreateQuestion} disabled={submitting || !newQuestion.trim()}>
                      <Send className="h-4 w-4 mr-1" />
                      Submit
                    </Button>
                  </div>
                </div>
              )}

              {/* Questions List */}
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-lg">
                      <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                      <div className="h-3 bg-slate-200 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <HelpCircle className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No questions yet</p>
                  <p className="text-xs text-slate-400 mt-1">Ask a question to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className={`rounded-lg border p-4 ${
                        q.status === "answered" ? "bg-emerald-50/50 border-emerald-200" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {q.status === "answered" ? (
                            <Badge className="bg-emerald-100 text-emerald-700">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Answered
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700">
                              <Clock className="h-4 w-4 mr-1" />
                              Pending
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {q.category}
                          </Badge>
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 mb-1">{q.question}</p>
                      <p className="text-xs text-slate-500">Asked by {q.asked_by}</p>

                      {q.answer && (
                        <div className="mt-3 p-3 rounded-lg bg-white border border-emerald-200">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-700">Answer from {q.answered_by}</span>
                          </div>
                          <p className="text-sm text-slate-700">{q.answer}</p>
                        </div>
                      )}

                      {/* Director-specific features */}
                      {currentUser.type === "director" && q.status === "open" && (
                        <div className="mt-4">
                          <Textarea
                            placeholder="Type your answer..."
                            value=""
                            onChange={(e) => handleAnswerQuestion(q.id, e.target.value)}
                            className="bg-white min-h-[60px]"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
