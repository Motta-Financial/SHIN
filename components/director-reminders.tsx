"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ClipboardList, MessageSquare, FileText } from "lucide-react"
import { useState, useEffect } from "react"

interface DirectorRemindersProps {
  selectedWeeks: string[]
  selectedClinic: string
}

export function DirectorReminders({ selectedWeeks, selectedClinic }: DirectorRemindersProps) {
  const [pendingEvaluations, setPendingEvaluations] = useState(0)
  const [unresolvedQuestions, setUnresolvedQuestions] = useState(0)
  const [documentsNeedingReview, setDocumentsNeedingReview] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReminders() {
      try {
        // Fetch documents to check for pending evaluations and reviews
        const docsResponse = await fetch("/api/documents")
        const docsData = await docsResponse.json()

        if (docsData.documents) {
          // Get current director name from selected clinic
          const CLINIC_DIRECTORS: Record<string, string> = {
            Consulting: "Nick Vadala",
            Accounting: "Mark Dwyer",
            Funding: "Ken Mooney",
            Marketing: "Chris Hill",
          }

          const currentDirector = CLINIC_DIRECTORS[selectedClinic as keyof typeof CLINIC_DIRECTORS]

          // Count PPTX files (midterm presentations) without evaluations from current director
          let pendingEvals = 0
          let docsNeedingReview = 0

          for (const doc of docsData.documents) {
            const isPPTX = doc.file_name.toLowerCase().endsWith(".pptx") || doc.file_name.toLowerCase().endsWith(".ppt")

            if (isPPTX) {
              // Check if current director has submitted an evaluation
              const evalsResponse = await fetch(`/api/evaluations?documentId=${doc.id}`)
              const evalsData = await evalsResponse.json()

              const hasEvaluation = evalsData.evaluations?.some(
                (evaluation: any) => evaluation.director_name === currentDirector,
              )

              if (!hasEvaluation) {
                pendingEvals++
              }
            } else {
              // For non-PPTX files (SOW documents), check if director has left a comment
              const reviewsResponse = await fetch(`/api/documents/reviews?documentId=${doc.id}`)
              const reviewsData = await reviewsResponse.json()

              const hasReview = reviewsData.reviews?.some((review: any) => review.director_name === currentDirector)

              if (!hasReview) {
                docsNeedingReview++
              }
            }
          }

          setPendingEvaluations(pendingEvals)
          setDocumentsNeedingReview(docsNeedingReview)
        }

        const questionsResponse = await fetch("/api/supabase/debriefs")
        const questionsData = await questionsResponse.json()

        if (questionsData.records) {
          const unresolvedCount = questionsData.records.filter((record: any) => {
            const fields = record.fields
            const dateSubmitted = fields["Date Submitted"]
            const clinic = fields["Related Clinic"]
            const question = fields["Questions"]

            // Filter by week - check if any selected week matches
            if (!dateSubmitted) return false
            const submittedDate = new Date(dateSubmitted)

            const isInSelectedWeeks = selectedWeeks.some((selectedWeek) => {
              const weekEnd = new Date(selectedWeek)
              const weekStart = new Date(weekEnd)
              weekStart.setDate(weekStart.getDate() - 6)
              return submittedDate >= weekStart && submittedDate <= weekEnd
            })

            // Filter by clinic
            const matchesClinic = selectedClinic === "all" || clinic === selectedClinic

            // Only include records with questions
            return isInSelectedWeeks && matchesClinic && question && question.trim().length > 0
          }).length

          setUnresolvedQuestions(unresolvedCount)
        }
      } catch (error) {
        console.error("[v0] Error fetching reminders:", error)
      } finally {
        setLoading(false)
      }
    }

    if (selectedClinic !== "all") {
      fetchReminders()
    } else {
      setLoading(false)
    }
  }, [selectedWeeks, selectedClinic])

  // Don't show banner if viewing "all" clinics or if there are no pending tasks
  if (
    selectedClinic === "all" ||
    loading ||
    (pendingEvaluations === 0 && unresolvedQuestions === 0 && documentsNeedingReview === 0)
  ) {
    return null
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">Pending Tasks</h3>
              <p className="text-sm text-orange-800">You have items that need your attention:</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {pendingEvaluations > 0 && (
                <Badge variant="secondary" className="gap-2 bg-orange-100 text-orange-900 hover:bg-orange-200">
                  <ClipboardList className="h-3.5 w-3.5" />
                  {pendingEvaluations} Midterm Evaluation{pendingEvaluations !== 1 ? "s" : ""} to Complete
                </Badge>
              )}

              {unresolvedQuestions > 0 && (
                <Badge variant="secondary" className="gap-2 bg-orange-100 text-orange-900 hover:bg-orange-200">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {unresolvedQuestions} Unresolved Question{unresolvedQuestions !== 1 ? "s" : ""}
                </Badge>
              )}

              {documentsNeedingReview > 0 && (
                <Badge variant="secondary" className="gap-2 bg-orange-100 text-orange-900 hover:bg-orange-200">
                  <FileText className="h-3.5 w-3.5" />
                  {documentsNeedingReview} Document{documentsNeedingReview !== 1 ? "s" : ""} Need Review
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
