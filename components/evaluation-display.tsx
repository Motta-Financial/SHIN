"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, Star, FileText } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface Evaluation {
  id: string
  director_name: string
  question_1_rating: number
  question_2_rating: number
  question_3_rating: number
  question_4_rating: number
  question_5_rating: number
  question_1_notes?: string
  question_2_notes?: string
  question_3_notes?: string
  question_4_notes?: string
  question_5_notes?: string
  additional_comments: string
  created_at: string
  updated_at: string
}

interface EvaluationDisplayProps {
  evaluations: Evaluation[]
}

const questions = [
  {
    short: "Presentation opening",
    full: "How was the presentation opening? (Consider attributes of clear & concise communication of presentation purpose and did the opening pique your interest.)",
  },
  {
    short: "Confidence and business knowledge",
    full: "Did the presenter(s) demonstrate confidence and knowledge of their client's business and how the business model works?",
  },
  {
    short: "Industry knowledge",
    full: "Did the presenter(s) demonstrate knowledge of their client's industry?",
  },
  {
    short: "Performance measurement knowledge",
    full: "Did the presenter(s) demonstrate knowledge of how the business measures/monitors performance?",
  },
  {
    short: "Project outline ability",
    full: "Was the team able to outline their project? (Consider ability to outline key deliverables and expected results.)",
  },
]

export function EvaluationDisplay({ evaluations }: EvaluationDisplayProps) {
  const [viewMode, setViewMode] = useState<"individual" | "comparison">("comparison")

  if (evaluations.length === 0) {
    return null
  }

  const getAverageRating = (evaluation: Evaluation) => {
    const ratings = [
      evaluation.question_1_rating,
      evaluation.question_2_rating,
      evaluation.question_3_rating,
      evaluation.question_4_rating,
      evaluation.question_5_rating,
    ]
    const sum = ratings.reduce((acc, rating) => acc + (rating || 0), 0)
    return (sum / ratings.length).toFixed(1)
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "bg-green-100 text-green-800 border-green-300"
    if (rating >= 3.5) return "bg-blue-100 text-blue-800 border-blue-300"
    if (rating >= 2.5) return "bg-yellow-100 text-yellow-800 border-yellow-300"
    return "bg-red-100 text-red-800 border-red-300"
  }

  const getRatingBadgeColor = (rating: number) => {
    if (rating >= 4) return "bg-green-500"
    if (rating >= 3) return "bg-blue-500"
    if (rating >= 2) return "bg-yellow-500"
    return "bg-red-500"
  }

  const ComparisonView = () => {
    const directors = evaluations.map((e) => e.director_name)

    return (
      <div className="space-y-6">
        {/* Overall Ratings Summary */}
        <Card className="p-4 bg-gradient-to-r from-[#0077B6]/5 to-[#002855]/5 border-[#0077B6]/20">
          <h4 className="text-sm font-bold text-[#002855] mb-3">Overall Ratings</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {evaluations.map((evaluation) => {
              const avgRating = Number.parseFloat(getAverageRating(evaluation))
              return (
                <div key={evaluation.id} className="bg-white rounded-lg p-3 border border-[#002855]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-full bg-[#0077B6] p-1.5">
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <p className="text-xs font-semibold text-[#002855]">{evaluation.director_name}</p>
                  </div>
                  <Badge className={`${getRatingColor(avgRating)} text-sm px-2 py-0.5`}>
                    <Star className="h-3 w-3 mr-1" />
                    {avgRating} / 5.0
                  </Badge>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Question-by-Question Comparison */}
        {questions.map((question, qIndex) => {
          const questionNum = qIndex + 1
          return (
            <Card key={qIndex} className="p-4 border-[#002855]/20">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-[#002855] mb-1">
                  Question {questionNum}: {question.short}
                </h4>
                <p className="text-xs text-[#002855]/60">{question.full}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evaluations.map((evaluation) => {
                  const rating = [
                    evaluation.question_1_rating,
                    evaluation.question_2_rating,
                    evaluation.question_3_rating,
                    evaluation.question_4_rating,
                    evaluation.question_5_rating,
                  ][qIndex]
                  const notes = [
                    evaluation.question_1_notes,
                    evaluation.question_2_notes,
                    evaluation.question_3_notes,
                    evaluation.question_4_notes,
                    evaluation.question_5_notes,
                  ][qIndex]

                  return (
                    <div key={evaluation.id} className="bg-gray-50 rounded-lg p-3 border border-[#002855]/10">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-[#002855]">{evaluation.director_name}</p>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full ${getRatingBadgeColor(rating)} flex items-center justify-center`}
                          >
                            <span className="text-white font-bold text-xs">{rating}</span>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {notes && (
                        <div className="mt-2 pt-2 border-t border-[#002855]/10">
                          <p className="text-xs text-[#002855]/70 mb-1 font-medium flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Notes:
                          </p>
                          <p className="text-xs text-[#002855]/80 leading-relaxed">{notes}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}

        {/* Additional Comments Section */}
        <Card className="p-4 border-[#002855]/20">
          <h4 className="text-sm font-bold text-[#002855] mb-3">Additional Comments</h4>
          <div className="space-y-3">
            {evaluations.map((evaluation) => (
              <div key={evaluation.id} className="bg-gray-50 rounded-lg p-3 border border-[#002855]/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-full bg-[#0077B6] p-1.5">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-[#002855]">{evaluation.director_name}</p>
                </div>
                {evaluation.additional_comments ? (
                  <p className="text-sm text-[#002855]/80 leading-relaxed">{evaluation.additional_comments}</p>
                ) : (
                  <p className="text-xs text-[#002855]/40 italic">No additional comments provided</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  const IndividualView = () => (
    <div className="space-y-4">
      {evaluations.map((evaluation) => {
        const avgRating = Number.parseFloat(getAverageRating(evaluation))
        const ratings = [
          evaluation.question_1_rating,
          evaluation.question_2_rating,
          evaluation.question_3_rating,
          evaluation.question_4_rating,
          evaluation.question_5_rating,
        ]

        return (
          <Card key={evaluation.id} className={`p-4 border-2 ${getRatingColor(avgRating)}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#0077B6] p-2">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[#002855]">{evaluation.director_name}</p>
                  <div className="flex items-center gap-2 text-xs text-[#002855]/60">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(evaluation.created_at).toLocaleDateString()}</span>
                    {evaluation.updated_at !== evaluation.created_at && <span>(Updated)</span>}
                  </div>
                </div>
              </div>
              <Badge className={`${getRatingColor(avgRating)} text-base px-3 py-1`}>
                <Star className="h-4 w-4 mr-1" />
                {avgRating} / 5.0
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
              {ratings.map((rating, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-[#002855]/10">
                  <div className="text-xs text-[#002855]/60 mb-1 font-medium">{questions[index].short}</div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full ${getRatingBadgeColor(rating)} flex items-center justify-center`}
                    >
                      <span className="text-white font-bold text-sm">{rating}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {evaluation.additional_comments && (
              <div className="bg-white rounded-lg p-3 border border-[#002855]/10">
                <p className="text-xs font-semibold text-[#002855] mb-1">Additional Comments:</p>
                <p className="text-sm text-[#002855]/80 leading-relaxed">{evaluation.additional_comments}</p>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-[#0077B6]" />
          <h4 className="text-lg font-bold text-[#002855]">Evaluations ({evaluations.length})</h4>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={viewMode === "comparison" ? "default" : "outline"}
            onClick={() => setViewMode("comparison")}
            className={
              viewMode === "comparison"
                ? "bg-[#0077B6] hover:bg-[#005a8c] text-white"
                : "border-[#002855]/20 bg-transparent"
            }
          >
            Comparison View
          </Button>
          <Button
            size="sm"
            variant={viewMode === "individual" ? "default" : "outline"}
            onClick={() => setViewMode("individual")}
            className={
              viewMode === "individual"
                ? "bg-[#0077B6] hover:bg-[#005a8c] text-white"
                : "border-[#002855]/20 bg-transparent"
            }
          >
            Individual View
          </Button>
        </div>
      </div>

      {viewMode === "comparison" ? <ComparisonView /> : <IndividualView />}
    </div>
  )
}
