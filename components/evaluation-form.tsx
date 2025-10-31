"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Send, X } from "lucide-react"

interface EvaluationFormProps {
  documentId: string
  directorName: string
  onSubmit: () => void
  onCancel: () => void
  existingEvaluation?: {
    question_1_rating?: number
    question_2_rating?: number
    question_3_rating?: number
    question_4_rating?: number
    question_5_rating?: number
    question_1_notes?: string
    question_2_notes?: string
    question_3_notes?: string
    question_4_notes?: string
    question_5_notes?: string
    additional_comments?: string
  }
}

const questions = [
  {
    id: 1,
    text: "How was the presentation opening? (Consider attributes of clear & concise communication of presentation purpose and did the opening pique your interest.)",
  },
  {
    id: 2,
    text: "Did the presenter(s) demonstrate confidence and knowledge of their client's business and how the business model works? (Consider knowing the market, customers, how the product/service is sold and delivered.)",
  },
  {
    id: 3,
    text: "Did the presenter(s) demonstrate knowledge of their client's industry? (Consider knowing the general market, competition, and where the client fits within the industry at their current business stage.)",
  },
  {
    id: 4,
    text: "Did the presenter(s) demonstrate knowledge of how the business measures/monitors performance? (Consider key performance indicators, reporting, and systems required to measure performance.)",
  },
  {
    id: 5,
    text: "Was the team able to outline their project? (Consider ability to outline key deliverables and expected results.)",
  },
]

export function EvaluationForm({
  documentId,
  directorName,
  onSubmit,
  onCancel,
  existingEvaluation,
}: EvaluationFormProps) {
  const [ratings, setRatings] = useState<Record<number, number>>({
    1: existingEvaluation?.question_1_rating || 0,
    2: existingEvaluation?.question_2_rating || 0,
    3: existingEvaluation?.question_3_rating || 0,
    4: existingEvaluation?.question_4_rating || 0,
    5: existingEvaluation?.question_5_rating || 0,
  })
  const [notes, setNotes] = useState<Record<number, string>>({
    1: existingEvaluation?.question_1_notes || "",
    2: existingEvaluation?.question_2_notes || "",
    3: existingEvaluation?.question_3_notes || "",
    4: existingEvaluation?.question_4_notes || "",
    5: existingEvaluation?.question_5_notes || "",
  })
  const [comments, setComments] = useState(existingEvaluation?.additional_comments || "")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    // Validate that all ratings are filled
    const allRated = Object.values(ratings).every((rating) => rating > 0)
    if (!allRated) {
      alert("Please provide ratings for all questions")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          directorName,
          question1Rating: ratings[1],
          question2Rating: ratings[2],
          question3Rating: ratings[3],
          question4Rating: ratings[4],
          question5Rating: ratings[5],
          question1Notes: notes[1].trim(),
          question2Notes: notes[2].trim(),
          question3Notes: notes[3].trim(),
          question4Notes: notes[4].trim(),
          question5Notes: notes[5].trim(),
          additionalComments: comments.trim(),
        }),
      })

      if (response.ok) {
        onSubmit()
      } else {
        alert("Failed to submit evaluation")
      }
    } catch (error) {
      console.error("[v0] Error submitting evaluation:", error)
      alert("Failed to submit evaluation")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="p-6 bg-white border-[#002855]/20">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#002855] mb-2">Midterm Presentation Evaluation</h3>
        <p className="text-sm text-[#002855]/70">Rating: 1 (Poor) – 5 (Excellent)</p>
        <p className="text-xs text-[#002855]/60 mt-1">Evaluator: {directorName}</p>
      </div>

      <div className="space-y-6">
        {questions.map((question) => (
          <div key={question.id} className="space-y-3 pb-6 border-b border-[#002855]/10 last:border-0">
            <Label className="text-sm font-semibold text-[#002855] leading-relaxed">
              {question.id}. {question.text}
            </Label>
            <RadioGroup
              value={ratings[question.id]?.toString() || ""}
              onValueChange={(value) => setRatings({ ...ratings, [question.id]: Number.parseInt(value) })}
              className="flex gap-4"
            >
              {[1, 2, 3, 4, 5].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <RadioGroupItem value={rating.toString()} id={`q${question.id}-${rating}`} />
                  <Label
                    htmlFor={`q${question.id}-${rating}`}
                    className="text-sm font-medium cursor-pointer hover:text-[#0077B6]"
                  >
                    {rating}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <div className="mt-3">
              <Label className="text-xs text-[#002855]/70 mb-1.5 block">Notes (optional):</Label>
              <Textarea
                placeholder="Add any specific notes or observations for this question..."
                value={notes[question.id]}
                onChange={(e) => setNotes({ ...notes, [question.id]: e.target.value })}
                className="min-h-[80px] text-sm bg-gray-50"
              />
            </div>
          </div>
        ))}

        <div className="space-y-3 pt-4">
          <Label className="text-sm font-semibold text-[#002855]">
            6. Any additional comments you would like to share?
          </Label>
          <Textarea
            placeholder="Enter your additional comments here..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="min-h-[120px] text-sm"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6 pt-6 border-t border-[#002855]/10">
        <Button
          onClick={handleSubmit}
          disabled={submitting || Object.values(ratings).some((r) => r === 0)}
          className="bg-[#0077B6] hover:bg-[#005a8c] text-white"
        >
          <Send className="h-4 w-4 mr-2" />
          {submitting ? "Submitting..." : existingEvaluation ? "Update Evaluation" : "Submit Evaluation"}
        </Button>
        <Button onClick={onCancel} variant="outline" className="border-[#002855]/20 bg-transparent">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </Card>
  )
}
