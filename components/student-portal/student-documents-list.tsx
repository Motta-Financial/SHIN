"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Download, CheckCircle, Star } from "lucide-react"

interface DocumentReview {
  id: string
  grade?: string
  comment?: string
  director_name: string
  created_at: string
}

interface Document {
  id: string
  file_name: string
  file_url: string
  file_type: string
  submission_type: string
  description?: string
  client_name: string
  clinic: string
  uploaded_at: string
  reviews: DocumentReview[]
}

interface StudentDocumentsListProps {
  documents: Document[]
}

export function StudentDocumentsList({ documents }: StudentDocumentsListProps) {
  const getSubmissionTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      midterm: "bg-blue-500",
      final: "bg-green-500",
      draft: "bg-amber-500",
      other: "bg-gray-500",
    }
    return <Badge className={colors[type] || colors.other}>{type}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Submissions
            </CardTitle>
            <CardDescription>Your uploaded deliverables and their reviews</CardDescription>
          </div>
          <Badge variant="outline">{documents.length} files</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No documents submitted yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium">{doc.file_name}</span>
                        {getSubmissionTypeBadge(doc.submission_type)}
                        {doc.reviews.length > 0 && (
                          <Badge variant="outline" className="gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Reviewed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{doc.client_name}</span>
                        <span>{formatDate(doc.uploaded_at)}</span>
                      </div>
                      {doc.description && <p className="text-sm text-muted-foreground mt-2">{doc.description}</p>}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-1" />
                        View
                      </a>
                    </Button>
                  </div>

                  {/* Reviews Section */}
                  {doc.reviews.length > 0 && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Director Feedback</p>
                      {doc.reviews.map((review) => (
                        <div key={review.id} className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{review.director_name}</span>
                            {review.grade && (
                              <Badge variant="outline" className="gap-1">
                                <Star className="h-3 w-3" />
                                {review.grade}
                              </Badge>
                            )}
                          </div>
                          {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(review.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
