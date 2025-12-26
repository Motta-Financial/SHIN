"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, Eye, Calendar, User, Star, ChevronDown, ChevronUp, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface Deliverable {
  id: string
  file_name: string
  file_url: string
  file_type: string
  description: string
  student_name: string
  clinic: string
  uploaded_at: string
  submission_type?: string
  evaluations: any[]
  reviews: any[]
}

interface ClientDeliverablesCardProps {
  deliverables: Deliverable[]
  loading?: boolean
}

export function ClientDeliverablesCard({ deliverables, loading }: ClientDeliverablesCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)

  const getFileIcon = (type: string) => {
    if (type?.includes("presentation") || type?.includes("ppt")) {
      return <FileText className="h-5 w-5 text-orange-500" />
    }
    if (type?.includes("spreadsheet") || type?.includes("excel")) {
      return <FileText className="h-5 w-5 text-green-500" />
    }
    if (type?.includes("pdf")) {
      return <FileText className="h-5 w-5 text-red-500" />
    }
    return <FileText className="h-5 w-5 text-blue-500" />
  }

  const getSubmissionTypeBadge = (type?: string) => {
    if (!type) return null
    const colors: Record<string, string> = {
      midterm: "bg-purple-100 text-purple-700 border-purple-300",
      final: "bg-blue-100 text-blue-700 border-blue-300",
      sow: "bg-amber-100 text-amber-700 border-amber-300",
      report: "bg-green-100 text-green-700 border-green-300",
    }
    const typeKey = type.toLowerCase()
    const colorClass =
      Object.entries(colors).find(([key]) => typeKey.includes(key))?.[1] || "bg-slate-100 text-slate-700"
    return <Badge className={`text-xs ${colorClass}`}>{type}</Badge>
  }

  if (loading) {
    return (
      <Card className="p-5 border-slate-200 bg-white">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
          <FileText className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Deliverables</h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  const previewCount = 3
  const previewDocs = deliverables.slice(0, previewCount)
  const remainingDocs = deliverables.slice(previewCount)

  return (
    <Card className="p-5 border-slate-200 bg-white">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
        <FileText className="h-5 w-5 text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-900">Deliverables</h2>
        <Badge variant="outline" className="ml-auto text-xs">
          {deliverables.length} Files
        </Badge>
      </div>

      {deliverables.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <FileText className="h-10 w-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No deliverables yet</p>
          <p className="text-xs text-slate-400 mt-1">Documents from your team will appear here</p>
        </div>
      ) : (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="space-y-3">
            {previewDocs.map((doc) => {
              const isOpen = expandedDoc === doc.id

              return (
                <div
                  key={doc.id}
                  className="rounded-lg bg-slate-50 border border-slate-200 overflow-hidden hover:bg-slate-100 transition-colors"
                >
                  <div className="p-4 cursor-pointer" onClick={() => setExpandedDoc(isOpen ? null : doc.id)}>
                    <div className="flex items-start gap-3">
                      {getFileIcon(doc.file_type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-medium text-slate-900 truncate">{doc.file_name}</h3>
                          {getSubmissionTypeBadge(doc.submission_type)}
                          {doc.evaluations.length > 0 && (
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Reviewed
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {doc.student_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-slate-200 p-4 bg-white">
                      {doc.description && <p className="text-sm text-slate-600 mb-4">{doc.description}</p>}

                      {/* Evaluations/Reviews */}
                      {doc.evaluations.length > 0 && (
                        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                          <h4 className="text-xs font-medium text-emerald-700 uppercase mb-2 flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Director Evaluation
                          </h4>
                          {doc.evaluations.map((eval_item: any, idx: number) => (
                            <div key={idx} className="text-sm">
                              <p className="text-slate-600">{eval_item.final_feedback || "Reviewed"}</p>
                              {eval_item.final_grade && (
                                <Badge className="mt-1 bg-emerald-200 text-emerald-800">
                                  Grade: {eval_item.final_grade}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {doc.reviews.length > 0 && (
                        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                          <h4 className="text-xs font-medium text-blue-700 uppercase mb-2 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Review Comments
                          </h4>
                          {doc.reviews.map((review: any, idx: number) => (
                            <div key={idx} className="text-sm text-slate-600">
                              <p>{review.comment}</p>
                              <p className="text-xs text-slate-400 mt-1">- {review.director_name}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.file_url} download={doc.file_name}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            <CollapsibleContent className="space-y-3">
              {remainingDocs.map((doc) => {
                const isOpen = expandedDoc === doc.id

                return (
                  <div
                    key={doc.id}
                    className="rounded-lg bg-slate-50 border border-slate-200 overflow-hidden hover:bg-slate-100 transition-colors"
                  >
                    <div className="p-4 cursor-pointer" onClick={() => setExpandedDoc(isOpen ? null : doc.id)}>
                      <div className="flex items-start gap-3">
                        {getFileIcon(doc.file_type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-sm font-medium text-slate-900 truncate">{doc.file_name}</h3>
                            {getSubmissionTypeBadge(doc.submission_type)}
                            {doc.evaluations.length > 0 && (
                              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Reviewed
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {doc.student_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>

                    {isOpen && (
                      <div className="border-t border-slate-200 p-4 bg-white">
                        {doc.description && <p className="text-sm text-slate-600 mb-4">{doc.description}</p>}
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={doc.file_url} download={doc.file_name}>
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </CollapsibleContent>
          </div>

          {remainingDocs.length > 0 && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-600">
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show {remainingDocs.length} More Deliverables
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          )}
        </Collapsible>
      )}
    </Card>
  )
}
