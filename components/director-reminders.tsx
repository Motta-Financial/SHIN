"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ClipboardList, MessageSquare, FileText } from "lucide-react"
import { useState, useEffect } from "react"

interface DirectorRemindersProps {
  selectedWeeks: string[]
  selectedClinic: string
}

interface Director {
  id: string
  full_name: string
  clinic_id: string
  clinicName?: string
}

export function DirectorReminders({ selectedWeeks, selectedClinic }: DirectorRemindersProps) {
  const [pendingEvaluations, setPendingEvaluations] = useState(0)
  const [unresolvedQuestions, setUnresolvedQuestions] = useState(0)
  const [documentsNeedingReview, setDocumentsNeedingReview] = useState(0)
  const [loading, setLoading] = useState(true)
  const [directors, setDirectors] = useState<Director[]>([])

  useEffect(() => {
    async function fetchDirectors() {
      try {
        const res = await fetch("/api/directors")
        if (res.ok) {
          const data = await res.json()
          setDirectors(data.directors || [])
        }
      } catch (error) {
        console.error("Error fetching directors:", error)
      }
    }
    fetchDirectors()
  }, [])

  useEffect(() => {
    async function fetchReminders() {
      try {
        const docsResponse = await fetch("/api/documents")
        const docsData = await docsResponse.json()

        if (docsData.documents) {
          let currentDirector: Director | undefined

          if (selectedClinic && selectedClinic !== "all") {
            // Check if selectedClinic is a UUID
            const isUUID = selectedClinic.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
            if (isUUID) {
              currentDirector = directors.find((d) => d.id === selectedClinic)
            } else {
              // Try to find by clinic name
              currentDirector = directors.find((d) => d.clinicName === selectedClinic)
            }
          }

          const currentDirectorName = currentDirector?.full_name

          let pendingEvals = 0
          let docsNeedingReview = 0

          for (const doc of docsData.documents) {
            const isPPTX = doc.file_name.toLowerCase().endsWith(".pptx") || doc.file_name.toLowerCase().endsWith(".ppt")

            if (isPPTX) {
              const evalsResponse = await fetch(`/api/evaluations?documentId=${doc.id}`)
              const evalsData = await evalsResponse.json()

              const hasEvaluation = currentDirectorName
                ? evalsData.evaluations?.some((evaluation: any) => evaluation.director_name === currentDirectorName)
                : false

              if (!hasEvaluation) {
                pendingEvals++
              }
            } else {
              const reviewsResponse = await fetch(`/api/documents/reviews?documentId=${doc.id}`)
              const reviewsData = await reviewsResponse.json()

              const hasReview = currentDirectorName
                ? reviewsData.reviews?.some((review: any) => review.director_name === currentDirectorName)
                : false

              if (!hasReview) {
                docsNeedingReview++
              }
            }
          }

          setPendingEvaluations(pendingEvals)
          setDocumentsNeedingReview(docsNeedingReview)
        }

        // Fetch debriefs for questions
        const questionsResponse = await fetch("/api/supabase/debriefs")
        const questionsData = await questionsResponse.json()

        if (questionsData.debriefs) {
          let filterClinicName = "all"
          if (selectedClinic && selectedClinic !== "all") {
            const isUUID = selectedClinic.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
            if (isUUID) {
              const director = directors.find((d) => d.id === selectedClinic)
              filterClinicName = director?.clinicName || "all"
            } else {
              filterClinicName = selectedClinic
            }
          }

          const unresolvedCount = questionsData.debriefs.filter((debrief: any) => {
            const dateSubmitted = debrief.date_submitted || debrief.dateSubmitted
            const clinic = debrief.clinic || ""
            const question = debrief.questions

            if (!dateSubmitted) return false
            const submittedDate = new Date(dateSubmitted)

            const isInSelectedWeeks =
              selectedWeeks.length === 0 ||
              selectedWeeks.some((selectedWeek) => {
                const weekEnd = new Date(selectedWeek)
                const weekStart = new Date(weekEnd)
                weekStart.setDate(weekStart.getDate() - 6)
                return submittedDate >= weekStart && submittedDate <= weekEnd
              })

            const normalizedClinic = clinic.toLowerCase().replace(" clinic", "").trim()
            const normalizedFilter = filterClinicName.toLowerCase().replace(" clinic", "").trim()
            const matchesClinic = filterClinicName === "all" || normalizedClinic === normalizedFilter

            return isInSelectedWeeks && matchesClinic && question && question.trim().length > 0
          }).length

          setUnresolvedQuestions(unresolvedCount)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching reminders:", error)
        setLoading(false)
      }
    }

    if (directors.length > 0 || selectedClinic === "all") {
      fetchReminders()
    }
  }, [selectedWeeks, selectedClinic, directors])

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
