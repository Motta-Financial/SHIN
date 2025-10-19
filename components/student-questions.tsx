"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, CheckCircle2, AlertCircle } from "lucide-react"
import { useState } from "react"

interface Question {
  id: string
  student: string
  clinic: string
  client: string
  question: string
  date: string
  resolved: boolean
}

interface StudentQuestionsProps {
  selectedWeek: string
  selectedClinic: string
}

export function StudentQuestions({ selectedWeek, selectedClinic }: StudentQuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch questions from debrief forms
  useState(() => {
    async function fetchQuestions() {
      try {
        const response = await fetch("/api/airtable/debriefs")
        const data = await response.json()

        if (data.records) {
          const questionsList: Question[] = data.records
            .filter((record: any) => {
              const fields = record.fields
              const dateSubmitted = fields["Date Submitted"]
              const clinic = fields["Related Clinic"]
              const question = fields["Questions"]

              // Filter by week
              if (!dateSubmitted) return false
              const submittedDate = new Date(dateSubmitted)
              const weekEnd = new Date(selectedWeek)
              const weekStart = new Date(weekEnd)
              weekStart.setDate(weekStart.getDate() - 6)

              const isInWeek = submittedDate >= weekStart && submittedDate <= weekEnd

              // Filter by clinic
              const matchesClinic = selectedClinic === "all" || clinic === selectedClinic

              // Only include records with questions
              return isInWeek && matchesClinic && question && question.trim().length > 0
            })
            .map((record: any) => {
              const fields = record.fields
              const studentName = fields["NAME (from SEED | Students)"]?.[0] || "Unknown"

              return {
                id: record.id,
                student: studentName,
                clinic: fields["Related Clinic"] || "Unknown",
                client: fields["Client"] || "Unknown",
                question: fields["Questions"] || "",
                date: fields["Date Submitted"] || "",
                resolved: false, // TODO: Add resolved status to Airtable
              }
            })

          setQuestions(questionsList)
        }
      } catch (error) {
        console.error("[v0] Error fetching questions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  })

  const toggleResolved = (id: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, resolved: !q.resolved } : q)))
  }

  const unresolvedCount = questions.filter((q) => !q.resolved).length

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Questions & Issues</CardTitle>
          <CardDescription>Loading questions...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Student Questions & Issues
            </CardTitle>
            <CardDescription>Questions from debrief submissions that need attention</CardDescription>
          </div>
          {unresolvedCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {unresolvedCount} Unresolved
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No questions submitted this week</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <div
                key={question.id}
                className={`p-4 rounded-lg border ${
                  question.resolved ? "bg-muted/50 border-muted" : "bg-background border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{question.student}</span>
                      <Badge variant="outline" className="text-xs">
                        {question.clinic}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {question.client}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(question.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={question.resolved ? "text-muted-foreground line-through" : ""}>{question.question}</p>
                  </div>
                  <Button
                    variant={question.resolved ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleResolved(question.id)}
                    className="shrink-0"
                  >
                    {question.resolved ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Resolved
                      </>
                    ) : (
                      "Mark Resolved"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
