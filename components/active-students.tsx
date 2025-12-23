"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, Users } from "lucide-react"
import { getClinicColor } from "@/lib/clinic-colors"
import { StakeholderContactCard } from "@/components/stakeholder"

interface ActiveStudentsProps {
  selectedWeek: string
  selectedClinic: string
}

interface StudentDebrief {
  id?: string
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
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch("/api/supabase/debriefs")
        if (res.ok) {
          const data = await res.json()
          const debriefs = data.debriefs || []

          const filteredDebriefs = debriefs
            .filter((debrief: any) => {
              const weekEnding = debrief.week_ending || debrief.weekEnding
              if (!weekEnding) return false

              const matchesWeek = !selectedWeek || weekEnding === selectedWeek

              const clinic = debrief.clinic || ""
              const matchesClinic = selectedClinic === "all" || clinic === selectedClinic

              return matchesWeek && matchesClinic
            })
            .map((debrief: any) => ({
              id: debrief.student_id || debrief.studentId,
              name: debrief.student_name || debrief.studentName || "Unknown",
              hours: debrief.hours_worked || debrief.hoursWorked || 0,
              clinic: debrief.clinic || "Unknown",
              client: debrief.client_name || debrief.clientName || "Unknown",
              summary: debrief.work_summary || debrief.workSummary || "No summary provided",
              dateSubmitted: debrief.week_ending || debrief.weekEnding || "",
              questions: "",
            }))

          setActiveStudents(filteredDebriefs)
        }
      } catch (error) {
        console.error("Error fetching debriefs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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
    id: debriefs[0].id,
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
              <div className="space-y-2">
                {previewStudents.map((student, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    {student.id ? (
                      <StakeholderContactCard type="student" id={student.id} name={student.name} variant="compact" />
                    ) : (
                      <span className="font-medium">{student.name}</span>
                    )}
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

              <CollapsibleContent>
                <div className="mt-4 space-y-4 border-t pt-4">
                  {uniqueStudents.slice(3).map((student, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        {student.id ? (
                          <StakeholderContactCard
                            type="student"
                            id={student.id}
                            name={student.name}
                            variant="compact"
                          />
                        ) : (
                          <span className="font-medium">{student.name}</span>
                        )}
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

                  <div className="mt-6 space-y-6">
                    <h4 className="font-semibold text-sm">Debrief Details</h4>
                    {uniqueStudents.map((student, studentIndex) => (
                      <div
                        key={studentIndex}
                        className="space-y-3 border-l-2 pl-4"
                        style={{ borderColor: getClinicColor(student.clinic).hex }}
                      >
                        {student.id ? (
                          <StakeholderContactCard
                            type="student"
                            id={student.id}
                            name={student.name}
                            variant="compact"
                          />
                        ) : (
                          <div className="font-medium">{student.name}</div>
                        )}
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
