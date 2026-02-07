"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, MessageSquare, Award, Filter, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Document {
  id: string
  student_name: string
  client_name: string
  file_url: string
  file_name: string
  description: string
  clinic: string
  uploaded_at: string
  file_type?: string
  submission_type?: string
}

interface Review {
  id: string
  director_name: string
  comment: string
  grade: string
  created_at: string
}

export function DirectorDocumentsDashboard() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [filterClinic, setFilterClinic] = useState<string>("all")
  const [filterClient, setFilterClient] = useState<string>("all")

  // Review form states
  const [reviewComment, setReviewComment] = useState("")
  const [reviewGrade, setReviewGrade] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [documents, searchTerm, filterClinic, filterClient])

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents")
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...documents]

    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
          doc.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterClinic !== "all") {
      filtered = filtered.filter((doc) => doc.clinic === filterClinic)
    }

    if (filterClient !== "all") {
      filtered = filtered.filter((doc) => doc.client_name === filterClient)
    }

    setFilteredDocuments(filtered)
  }

  const handleDocumentClick = async (doc: Document) => {
    setSelectedDocument(doc)
    setReviewComment("")
    setReviewGrade("")

    // Fetch existing reviews
    try {
      const response = await fetch(`/api/documents/reviews?documentId=${doc.id}`)
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error("Error fetching reviews:", error)
    }
  }

  const handleSubmitReview = async () => {
    if (!selectedDocument || (!reviewComment.trim() && !reviewGrade)) {
      return
    }

    setSubmittingReview(true)
    try {
      const response = await fetch("/api/documents/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedDocument.id,
          directorName: "Director", // TODO: Get from auth context
          comment: reviewComment,
          grade: reviewGrade,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setReviews([...reviews, data.review])
        setReviewComment("")
        setReviewGrade("")
        alert("Review submitted successfully!")
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      alert("Failed to submit review")
    } finally {
      setSubmittingReview(false)
    }
  }

  const uniqueClinics = Array.from(new Set(documents.map((d) => d.clinic).filter(Boolean)))
  const uniqueClients = Array.from(new Set(documents.map((d) => d.client_name).filter(Boolean)))

  return (
  <div className="space-y-6 pt-6">
  <div>
  <h2 className="text-2xl font-bold text-foreground">Document Review Dashboard</h2>
  <p className="text-muted-foreground">Review student submissions and provide feedback</p>
  </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student, client, or file name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterClinic} onValueChange={setFilterClinic}>
              <SelectTrigger>
                <SelectValue placeholder="All Clinics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clinics</SelectItem>
                {uniqueClinics.map((clinic) => (
                  <SelectItem key={clinic} value={clinic}>
                    {clinic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger>
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {uniqueClients.map((client) => (
                  <SelectItem key={client} value={client}>
                    {client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Submitted Documents ({filteredDocuments.length})
            </CardTitle>
            <CardDescription>Click a document to review and provide feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading documents...</p>
            ) : filteredDocuments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No documents found</p>
            ) : (
              filteredDocuments.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleDocumentClick(doc)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedDocument?.id === doc.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium text-foreground truncate">{doc.file_name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {doc.student_name} • {doc.client_name}
                      </p>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {doc.clinic && (
                          <Badge variant="secondary" className="text-xs">
                            {doc.clinic}
                          </Badge>
                        )}
                        {doc.submission_type && (
                          <Badge variant="outline" className="text-xs">
                            {doc.submission_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Review Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Review & Feedback
            </CardTitle>
            <CardDescription>Provide comments and grades for the selected document</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDocument ? (
              <>
                {/* Document Details */}
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h3 className="font-semibold text-foreground">{selectedDocument.file_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Student:</span> {selectedDocument.student_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Client:</span> {selectedDocument.client_name}
                  </p>
                  {selectedDocument.description && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Description:</span> {selectedDocument.description}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 bg-transparent"
                    onClick={() => window.open(selectedDocument.file_url, "_blank")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Document
                  </Button>
                </div>

                {/* Existing Reviews */}
                {reviews.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-foreground">Previous Reviews</h4>
                    {reviews.map((review) => (
                      <div key={review.id} className="p-3 bg-muted/50 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-foreground">{review.director_name}</span>
                          {review.grade && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              {review.grade}
                            </Badge>
                          )}
                        </div>
                        {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(review.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Review Form */}
                <div className="space-y-3 pt-3 border-t border-border">
                  <h4 className="font-medium text-sm text-foreground">Add Review</h4>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Grade</label>
                    <Input
                      placeholder="e.g., A, B+, 95/100"
                      value={reviewGrade}
                      onChange={(e) => setReviewGrade(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Comments</label>
                    <Textarea
                      placeholder="Provide feedback on the submission..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={handleSubmitReview}
                    disabled={(!reviewComment.trim() && !reviewGrade) || submittingReview}
                    className="w-full"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a document to review</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
