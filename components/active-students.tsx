"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, Users } from "lucide-react"
import { getClinicColor } from "@/lib/clinic-colors"

interface ActiveStudentsProps {
  selectedWeek: string
  selectedClinic: string
}

interface StudentDebrief {
  name: string
  hours: number
  clinic: string
  client: string
  summary: string
  dateSubmitted: string
  questions?: string
}

export function ActiveStudents({ selectedWeek, selectedClinic }: ActiveStudentsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeStudents, setActiveStudents] = useState<StudentDebrief[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActiveStudents() {
      try {
        setLoading(true)
        const response = await fetch("/api/airtable/debriefs")
        const data = await response.json()

        if (data.records) {
          // Filter debriefs for the selected week
          const weekEnd = new Date(selectedWeek)
          const weekStart = new Date(weekEnd)
          weekStart.setDate(weekEnd.getDate() - 6)

          const filteredDebriefs = data.records
            .filter((record: any) => {
              const fields = record.fields
              const dateSubmitted = fields["Date Submitted"]
              if (!dateSubmitted) return false

              const submissionDate = new Date(dateSubmitted)
              const isInWeek = submissionDate >= weekStart && submissionDate <= weekEnd

              // Filter by clinic if selected
              const clinic = fields["Related Clinic"] || ""
              const matchesClinic = selectedClinic === "all" || clinic === selectedClinic

              return isInWeek && matchesClinic
            })
            .map((record: any) => {
              const fields = record.fields
              return {
                name: fields["NAME (from SEED | Students)"]?.[0] || "Unknown",
                hours: fields["Number of Hours Worked"] || 0,
                clinic: fields["Related Clinic"] || "Unknown",
                client: fields["Client"] || "Unknown",
                summary: fields["Summary of Work"] || "No summary provided",
                dateSubmitted: fields["Date Submitted"] || "",
                questions: fields["Questions"] || "",
              }
            })

          setActiveStudents(filteredDebriefs)
        }
      } catch (error) {
        console.error("[v0] Error fetching active students:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveStudents()
  }, [selectedWeek, selectedClinic])

  // Group debriefs by student
  const studentMap = new Map<string, StudentDebrief[]>()
  activeStudents.forEach((debrief) => {
    if (!studentMap.has(debrief.name)) {
      studentMap.set(debrief.name, [])
    }
    studentMap.get(debrief.name)!.push(debrief)
  })

  const uniqueStudents = Array.from(studentMap.entries()).map(([name, debriefs]) => ({
    name,
    totalHours: debriefs.reduce((sum, d) => sum + d.hours, 0),
    clinic: debriefs[0].clinic,
    debriefs,
  }))

  const previewStudents = uniqueStudents.slice(0, 3)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Students
                <Badge variant="secondary" className="ml-2">
                  {uniqueStudents.length}
                </Badge>
              </CardTitle>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CardContent>
          {uniqueStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active students for this week</p>
          ) : (
            <>
              {/* Preview - Always visible */}
              <div className="space-y-2">
                {previewStudents.map((student, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{student.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: getClinicColor(student.clinic).hex,
                          color: getClinicColor(student.clinic).hex,
                        }}
                      >
                        {student.clinic}
                      </Badge>
                      <span className="text-muted-foreground">{student.totalHours}h</span>
                    </div>
                  </div>
                ))}
                {uniqueStudents.length > 3 && !isOpen && (
                  <p className="text-sm text-muted-foreground">+{uniqueStudents.length - 3} more students</p>
                )}
              </div>

              {/* Expanded view - Shows all students with debrief details */}
              <CollapsibleContent>
                <div className="mt-4 space-y-4 border-t pt-4">
                  {uniqueStudents.slice(3).map((student, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{student.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: getClinicColor(student.clinic).hex,
                              color: getClinicColor(student.clinic).hex,
                            }}
                          >
                            {student.clinic}
                          </Badge>
                          <span className="text-muted-foreground">{student.totalHours}h</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Detailed debrief information */}
                  <div className="mt-6 space-y-6">
                    <h4 className="font-semibold text-sm">Debrief Details</h4>
                    {uniqueStudents.map((student, studentIndex) => (
                      <div
                        key={studentIndex}
                        className="space-y-3 border-l-2 pl-4"
                        style={{ borderColor: getClinicColor(student.clinic).hex }}
                      >
                        <div className="font-medium">{student.name}</div>
                        {student.debriefs.map((debrief, debriefIndex) => (
                          <div key={debriefIndex} className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{debrief.client}</Badge>
                              <span className="text-muted-foreground">{debrief.hours}h</span>
                              <span className="text-muted-foreground text-xs">
                                {new Date(debrief.dateSubmitted).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-muted-foreground">{debrief.summary}</p>
                            {debrief.questions && (
                              <div className="bg-muted p-2 rounded text-xs">
                                <span className="font-medium">Question: </span>
                                {debrief.questions}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </>
          )}
        </CardContent>
      </Collapsible>
    </Card>
  )
}
