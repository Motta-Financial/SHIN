"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, MessageCircle, CheckCircle, Clock, Send, Plus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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

interface ClientQuestionsCardProps {
  questions: Question[]
  clientId: string
  clientName: string
  clientEmail: string
  onQuestionAdded?: () => void
  loading?: boolean
}

export function ClientQuestionsCard({
  questions,
  clientId,
  clientName,
  clientEmail,
  onQuestionAdded,
  loading,
}: ClientQuestionsCardProps) {
  const [showNewQuestion, setShowNewQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState("")
  const [category, setCategory] = useState("general")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/client-portal/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          question: newQuestion.trim(),
          askedBy: clientName,
          askedByEmail: clientEmail,
          category,
        }),
      })

      if (response.ok) {
        setNewQuestion("")
        setShowNewQuestion(false)
        setCategory("general")
        onQuestionAdded?.()
      }
    } catch (error) {
      console.error("Error submitting question:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: Question["status"]) => {
    switch (status) {
      case "answered":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Answered
          </Badge>
        )
      case "closed":
        return <Badge className="bg-slate-100 text-slate-600 border-slate-300">Closed</Badge>
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Awaiting Response
          </Badge>
        )
    }
  }

  const getCategoryBadge = (cat: string) => {
    const colors: Record<string, string> = {
      general: "bg-slate-100 text-slate-600",
      project: "bg-blue-100 text-blue-600",
      timeline: "bg-purple-100 text-purple-600",
      deliverables: "bg-green-100 text-green-600",
      billing: "bg-amber-100 text-amber-600",
    }
    return colors[cat] || colors.general
  }

  const openQuestions = questions.filter((q) => q.status === "open")
  const answeredQuestions = questions.filter((q) => q.status === "answered")

  if (loading) {
    return (
      <Card className="p-5 border-slate-200 bg-white">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
          <HelpCircle className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Questions & Answers</h2>
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
        <HelpCircle className="h-5 w-5 text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-900">Questions & Answers</h2>
        <div className="ml-auto flex items-center gap-2">
          {openQuestions.length > 0 && (
            <Badge className="bg-amber-100 text-amber-700">{openQuestions.length} Pending</Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowNewQuestion(!showNewQuestion)}
            className="border-slate-300"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ask Question
          </Button>
        </div>
      </div>

      {/* New Question Form */}
      {showNewQuestion && (
        <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <h4 className="text-sm font-medium text-slate-900 mb-3">Ask a New Question</h4>
          <div className="space-y-3">
            <div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="project">Project Scope</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                  <SelectItem value="deliverables">Deliverables</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Type your question here..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="min-h-[80px] bg-white"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowNewQuestion(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitQuestion}
                disabled={!newQuestion.trim() || submitting}
                className="bg-slate-700 hover:bg-slate-800"
              >
                {submitting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                Submit Question
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <MessageCircle className="h-10 w-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No questions yet</p>
            <p className="text-xs text-slate-400 mt-1">Click "Ask Question" to get started</p>
          </div>
        ) : (
          questions.map((q) => (
            <div
              key={q.id}
              className={`rounded-lg border p-4 ${
                q.status === "answered" ? "bg-emerald-50/50 border-emerald-200" : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(q.status)}
                  <Badge variant="outline" className={`text-xs ${getCategoryBadge(q.category)}`}>
                    {q.category}
                  </Badge>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                </span>
              </div>

              <div className="mb-3">
                <p className="text-sm font-medium text-slate-900">{q.question}</p>
                <p className="text-xs text-slate-500 mt-1">Asked by {q.asked_by}</p>
              </div>

              {q.answer && (
                <div className="mt-3 p-3 rounded-lg bg-white border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Answer from {q.answered_by}</span>
                    {q.answered_at && (
                      <span className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(q.answered_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700">{q.answer}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
