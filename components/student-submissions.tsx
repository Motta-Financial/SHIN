"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, ExternalLink, Calendar, User, CheckCircle, Clock } from "lucide-react"

interface Submission {
  id: string
  fields: {
    "Student Name"?: string
    Client?: string
    Description?: string
    "Document URL"?: string
    "Related Clinic"?: string
    "Date Submitted"?: string
    Status?: string
  }
}

interface StudentSubmissionsProps {
  selectedWeek: string
  selectedClinic: string
}

const CLINIC_COLORS = {
  Consulting: { bg: "bg-[#4A6FA5]/10", border: "border-[#4A6FA5]/30", text: "text-[#4A6FA5]" },
  Accounting: { bg: "bg-[#5B7C99]/10", border: "border-[#5B7C99]/30", text: "text-[#5B7C99]" },
  "Resource Acquisition": { bg: "bg-[#8B7B8B]/10", border: "border-[#8B7B8B]/30", text: "text-[#8B7B8B]" },
  Marketing: { bg: "bg-[#C4B5C4]/10", border: "border-[#C4B5C4]/30", text: "text-[#C4B5C4]" },
}

const mockSubmissions: Submission[] = [
  {
    id: "1",
    fields: {
      "Student Name": "John Smith",
      Client: "Serene Cycle",
      Description: "Financial analysis report Q4",
      "Document URL": "#",
      "Related Clinic": "Accounting",
      "Date Submitted": "2025-01-15",
      Status: "Pending Review",
    },
  },
  {
    id: "2",
    fields: {
      "Student Name": "Jane Doe",
      Client: "Tech Startup",
      Description: "Marketing strategy presentation",
      "Document URL": "#",
      "Related Clinic": "Marketing",
      "Date Submitted": "2025-01-14",
      Status: "Reviewed",
    },
  },
]

export function StudentSubmissions({ selectedWeek, selectedClinic }: StudentSubmissionsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSubmissions(mockSubmissions)
    setLoading(false)
  }, [])

  const filteredSubmissions = submissions.filter((submission) => {
    if (selectedClinic !== "all" && submission.fields["Related Clinic"] !== selectedClinic) {
      return false
    }
    return true
  })

  const pendingSubmissions = filteredSubmissions.filter((s) => s.fields.Status === "Pending Review")
  const reviewedSubmissions = filteredSubmissions.filter((s) => s.fields.Status === "Reviewed")

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-slate-500">Loading submissions...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-200/60 shadow-sm">
      <CardHeader className="border-b border-slate-200/60 bg-purple-50/50">
        <CardTitle className="flex items-center gap-2 text-slate-900 text-2xl">
          <FileText className="h-5 w-5 text-purple-600" />
          Student Work Submissions
        </CardTitle>
        <CardDescription className="text-slate-600">
          Documents and work papers submitted by students for feedback ({pendingSubmissions.length} pending review)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {filteredSubmissions.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-500">No submissions yet</p>
            <p className="mt-2 text-sm text-slate-400">Student work submissions will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingSubmissions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  Pending Review ({pendingSubmissions.length})
                </h3>
                <div className="space-y-3">
                  {pendingSubmissions.map((submission) => {
                    const clinic = submission.fields["Related Clinic"] || "Unknown"
                    const clinicColor = CLINIC_COLORS[clinic as keyof typeof CLINIC_COLORS] || CLINIC_COLORS.Consulting

                    return (
                      <div
                        key={submission.id}
                        className={`rounded-lg border p-4 ${clinicColor.bg} ${clinicColor.border}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-slate-900">{submission.fields.Client}</h4>
                              <Badge variant="outline" className={`${clinicColor.text} border-current`}>
                                {clinic}
                              </Badge>
                              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                                Pending
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                              <User className="h-3 w-3" />
                              <span>{submission.fields["Student Name"]}</span>
                              <span className="text-slate-400">•</span>
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(submission.fields["Date Submitted"] || "").toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 mb-3">{submission.fields.Description}</p>
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="border-purple-300 text-purple-700 hover:bg-purple-50 bg-transparent"
                            >
                              <a
                                href={submission.fields["Document URL"]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View Document
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {reviewedSubmissions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Reviewed ({reviewedSubmissions.length})
                </h3>
                <div className="space-y-3">
                  {reviewedSubmissions.map((submission) => {
                    const clinic = submission.fields["Related Clinic"] || "Unknown"
                    const clinicColor = CLINIC_COLORS[clinic as keyof typeof CLINIC_COLORS] || CLINIC_COLORS.Consulting

                    return (
                      <div
                        key={submission.id}
                        className={`rounded-lg border p-4 opacity-75 ${clinicColor.bg} ${clinicColor.border}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-slate-900">{submission.fields.Client}</h4>
                              <Badge variant="outline" className={`${clinicColor.text} border-current`}>
                                {clinic}
                              </Badge>
                              <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                                Reviewed
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                              <User className="h-3 w-3" />
                              <span>{submission.fields["Student Name"]}</span>
                              <span className="text-slate-400">•</span>
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(submission.fields["Date Submitted"] || "").toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 mb-3">{submission.fields.Description}</p>
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-transparent"
                            >
                              <a
                                href={submission.fields["Document URL"]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View Document
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
