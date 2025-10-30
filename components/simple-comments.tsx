"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, User, Calendar } from "lucide-react"

interface Review {
  id: string
  document_id: string
  director_name: string
  comment: string
  grade: string
  created_at: string
}

interface SimpleCommentsProps {
  documentId: string
  directorName: string
  existingReviews: Review[]
  onSubmit: () => void
}

export function SimpleComments({ documentId, directorName, existingReviews, onSubmit }: SimpleCommentsProps) {
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const currentDirectorReview = existingReviews.find((r) => r.director_name === directorName)

  const handleSubmit = async () => {
    if (!comment.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/documents/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          directorName,
          comment: comment.trim(),
          grade: "", // No grade for simple comments
        }),
      })

      if (response.ok) {
        setComment("")
        setShowForm(false)
        onSubmit()
      }
    } catch (error) {
      console.error("[v0] Error submitting comment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Show existing reviews */}
      {existingReviews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#0077B6]" />
            <h5 className="text-sm font-bold text-[#002855]">Director Comments</h5>
          </div>
          {existingReviews.map((review) => (
            <Card key={review.id} className="p-3 bg-slate-50 border-slate-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-[#0077B6]" />
                  <span className="text-sm font-semibold text-[#002855]">{review.director_name}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="h-3 w-3" />
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{review.comment}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Update comment form */}
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-[#0077B6] hover:bg-[#005a8c] text-white"
          size="sm"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          {currentDirectorReview ? "Update Your Comment" : "Add Your Comment"}
        </Button>
      ) : (
        <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#0077B6]" />
            <h5 className="text-sm font-bold text-[#002855]">Your Comment</h5>
            <Badge className="bg-[#0077B6] text-white text-xs">{directorName}</Badge>
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add your comments or feedback about this document..."
            className="min-h-[100px] resize-none"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !comment.trim()}
              className="flex-1 bg-[#0077B6] hover:bg-[#005a8c] text-white"
              size="sm"
            >
              {submitting ? "Submitting..." : currentDirectorReview ? "Update Comment" : "Submit Comment"}
            </Button>
            <Button
              onClick={() => {
                setShowForm(false)
                setComment("")
              }}
              variant="outline"
              size="sm"
              className="border-slate-300"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
