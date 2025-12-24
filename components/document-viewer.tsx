"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FileText, MessageSquare, Star, Send, ExternalLink, User, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DocumentUpload } from "@/components/document-upload"

interface Document {
  id: string
  student_name: string
  client_name: string
  file_url: string
  file_name: string
  description: string
  clinic: string
  uploaded_at: string
}

interface Review {
  id: string
  document_id: string
  director_name: string
  comment: string
  grade: string
  created_at: string
}

interface DocumentViewerProps {
  clientName: string
  directorName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DocumentViewer({ clientName, directorName, open, onOpenChange }: DocumentViewerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [reviews, setReviews] = useState<Record<string, Review[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [comment, setComment] = useState("")
  const [grade, setGrade] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      fetchDocuments()
    }
  }, [open, clientName])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/documents?client=${encodeURIComponent(clientName)}`)
      const data = await response.json()

      if (data.documents) {
        setDocuments(data.documents)

        // Fetch reviews for each document
        const reviewsData: Record<string, Review[]> = {}
        await Promise.all(
          data.documents.map(async (doc: Document) => {
            const reviewRes = await fetch(`/api/documents/reviews?documentId=${doc.id}`)
            const reviewData = await reviewRes.json()
            reviewsData[doc.id] = reviewData.reviews || []
          }),
        )
        setReviews(reviewsData)
      }
    } catch (error) {
      console.error("[v0] Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (documentId: string) => {
    if (!comment.trim() && !grade.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/documents/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          directorName,
          comment: comment.trim(),
          grade: grade.trim(),
        }),
      })

      if (response.ok) {
        setComment("")
        setGrade("")
        setSelectedDoc(null)
        await fetchDocuments()
      }
    } catch (error) {
      console.error("[v0] Error submitting review:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const getGradeColor = (grade: string) => {
    const gradeUpper = grade.toUpperCase()
    if (gradeUpper.includes("A")) return "bg-green-100 text-green-800 border-green-300"
    if (gradeUpper.includes("B")) return "bg-blue-100 text-blue-800 border-blue-300"
    if (gradeUpper.includes("C")) return "bg-yellow-100 text-yellow-800 border-yellow-300"
    return "bg-slate-100 text-slate-800 border-slate-300"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#0077B6]" />
            Documents for {clientName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0077B6] mx-auto mb-4"></div>
              <p className="text-slate-600">Loading documents...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-b pb-4">
              <DocumentUpload
                clientName={clientName}
                studentName={directorName}
                title="Upload New Document"
                description={`Upload documents for ${clientName}`}
                onUploadComplete={() => fetchDocuments()}
                compact
              />
            </div>

            {documents.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No documents uploaded yet</p>
                  <p className="text-sm text-slate-500 mt-2">Use the upload button above to add documents</p>
                </div>
              </div>
            ) : (
              documents.map((doc) => {
                const docReviews = reviews[doc.id] || []
                const isExpanded = selectedDoc === doc.id

                return (
                  <Card key={doc.id} className="border-slate-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-[#0077B6]" />
                            <CardTitle className="text-base">{doc.file_name}</CardTitle>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {doc.student_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(doc.uploaded_at).toLocaleDateString()}
                            </span>
                            {doc.clinic && (
                              <Badge variant="outline" className="text-xs">
                                {doc.clinic}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-[#0077B6] text-[#0077B6] hover:bg-[#0077B6] hover:text-white bg-transparent"
                        >
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open
                          </a>
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {doc.description && (
                        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                          <p className="text-sm text-slate-700">{doc.description}</p>
                        </div>
                      )}

                      {/* Reviews Section */}
                      {docReviews.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <MessageSquare className="h-4 w-4" />
                            Reviews ({docReviews.length})
                          </div>
                          {docReviews.map((review) => (
                            <div key={review.id} className="rounded-lg bg-blue-50 p-3 border border-blue-200">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="rounded-full bg-blue-100 p-1">
                                    <User className="h-3 w-3 text-blue-600" />
                                  </div>
                                  <span className="text-sm font-medium text-slate-900">{review.director_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {review.grade && (
                                    <Badge className={getGradeColor(review.grade)}>
                                      <Star className="h-3 w-3 mr-1" />
                                      {review.grade}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-slate-500">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              {review.comment && <p className="text-sm text-slate-700 mt-2">{review.comment}</p>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Review Form */}
                      {isExpanded ? (
                        <div className="space-y-3 rounded-lg bg-slate-50 p-4 border border-slate-200">
                          <div className="grid grid-cols-4 gap-3">
                            <div className="col-span-3">
                              <label className="text-sm font-medium text-slate-700 mb-1 block">Comment</label>
                              <Textarea
                                placeholder="Add your feedback..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="min-h-[80px] text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-700 mb-1 block">Grade</label>
                              <Input
                                placeholder="A, B+, etc."
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                className="text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSubmitReview(doc.id)}
                              disabled={submitting || (!comment.trim() && !grade.trim())}
                              size="sm"
                              className="bg-[#0077B6] hover:bg-[#005a8c] text-white"
                            >
                              <Send className="h-4 w-4 mr-1" />
                              {submitting ? "Submitting..." : "Submit Review"}
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedDoc(null)
                                setComment("")
                                setGrade("")
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setSelectedDoc(doc.id)}
                          variant="outline"
                          size="sm"
                          className="w-full border-[#0077B6] text-[#0077B6] hover:bg-[#0077B6] hover:text-white"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Add Review & Grade
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
