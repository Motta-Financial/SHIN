"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronDown, ChevronRight, FileText } from "lucide-react"
import { useState, useEffect } from "react"

interface DebriefSubmission {
  id: string
  student: string
  clinic: string
  client: string
  hours: number
  summary: string
  date: string
  question?: string
}

interface WeekScheduleInfo {
  weekStart: string
  weekEnd: string
}

interface DetailedDebriefsProps {
  selectedWeeks: string[]
  selectedClinic: string
  weekSchedule?: WeekScheduleInfo[]
}

export function DetailedDebriefs({ selectedWeeks, selectedClinic, weekSchedule = [] }: DetailedDebriefsProps) {
  const [submissions, setSubmissions] = useState<DebriefSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchDebriefs() {
      setLoading(true)
      try {
        const response = await fetch("/api/supabase/debriefs")
        const data = await response.json()

        if (data.debriefs) {
          // Build a set of week_end dates that correspond to selected week_start dates
          const selectedWeekEnds = new Set<string>()
          for (const weekStart of selectedWeeks) {
            const match = weekSchedule.find((w) => w.weekStart === weekStart)
            if (match) {
              selectedWeekEnds.add(match.weekEnd)
            }
          }
          // Also add the selectedWeeks themselves as fallback
          for (const w of selectedWeeks) {
            selectedWeekEnds.add(w)
          }

          const debriefsList: DebriefSubmission[] = data.debriefs
            .filter((debrief: any) => {
              const weekEnding = debrief.weekEnding
              const clinic = debrief.clinic

              if (!weekEnding) return false
              const isInSelectedWeeks = selectedWeekEnds.has(weekEnding)

              // Filter by clinic
              const matchesClinic = selectedClinic === "all" || clinic === selectedClinic

              return isInSelectedWeeks && matchesClinic
            })
            .map((debrief: any) => ({
              id: debrief.id,
              student: debrief.studentName || "Unknown",
              clinic: debrief.clinic || "Unknown",
              client: debrief.clientName || "Unknown",
              hours: debrief.hoursWorked || 0,
              summary: debrief.workSummary || "",
              date: debrief.weekEnding || "",
              question: debrief.questions || undefined,
            }))
            .sort((a: DebriefSubmission, b: DebriefSubmission) => new Date(b.date).getTime() - new Date(a.date).getTime())

          setSubmissions(debriefsList)
        }
      } catch (error) {
        console.error("[v0] Error fetching debriefs:", error)
      } finally {
        setLoading(false)
      }
    }

    if (selectedWeeks.length > 0) {
      fetchDebriefs()
    } else {
      setSubmissions([])
      setLoading(false)
    }
  }, [selectedWeeks, selectedClinic])

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const getWeeksDescription = () => {
    if (selectedWeeks.length === 0) return "No weeks selected"
    if (selectedWeeks.length === 1) return `Week ending ${new Date(selectedWeeks[0]).toLocaleDateString()}`
    return `${selectedWeeks.length} weeks selected`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detailed Debrief Submissions</CardTitle>
          <CardDescription>Loading submissions...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Detailed Debrief Submissions
        </CardTitle>
        <CardDescription>
          {getWeeksDescription()} ({submissions.length} submissions)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No debrief submissions for the selected {selectedWeeks.length === 1 ? "week" : "weeks"}</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Clinic</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <>
                    <TableRow key={submission.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell onClick={() => toggleRow(submission.id)}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          {expandedRows.has(submission.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{submission.student}</TableCell>
                      <TableCell>{submission.client}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{submission.clinic}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{submission.hours}h</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(submission.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(submission.id) && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30">
                          <div className="p-4 space-y-3">
                            <div>
                              <h4 className="font-semibold mb-1">Summary of Work:</h4>
                              <p className="text-sm">{submission.summary}</p>
                            </div>
                            {submission.question && (
                              <div>
                                <h4 className="font-semibold mb-1">Questions/Issues:</h4>
                                <p className="text-sm text-muted-foreground">{submission.question}</p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
