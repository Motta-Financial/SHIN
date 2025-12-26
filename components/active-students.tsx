"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Users, Clock, FileText } from "lucide-react"
import { getClinicColor } from "@/lib/clinic-colors"
import { StakeholderContactCard } from "@/components/stakeholder"
import { Button } from "@/components/ui/button"

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

interface Director {
  id: string
  full_name: string
  clinicName?: string
}

export function ActiveStudents({ selectedWeek, selectedClinic }: ActiveStudentsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set())
  const [activeStudents, setActiveStudents] = useState<StudentDebrief[]>([])
  const [loading, setLoading] = useState(true)
  const [directors, setDirectors] = useState<Director[]>([])

  const toggleStudent = (studentName: string) => {
    setExpandedStudents((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(studentName)) {
        newSet.delete(studentName)
      } else {
        newSet.add(studentName)
      }
      return newSet
    })
  }

  useEffect(() => {
    async function fetchDirectors() {
      try {
        const res = await fetch("/api/directors")
        if (res.ok) {
          const data = await res.json()
          setDirectors(data.directors || [])
        }
      } catch (error) {
        console.error("Error fetching directors:", error)
      }
    }
    fetchDirectors()
  }, [])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch("/api/supabase/debriefs")
        if (res.ok) {
          const data = await res.json()
          const debriefs = data.debriefs || []

          let filterClinicName = "all"
          if (selectedClinic && selectedClinic !== "all") {
            const isUUID = selectedClinic.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
            if (isUUID) {
              const director = directors.find((d) => d.id === selectedClinic)
              filterClinicName = director?.clinicName || "all"
            } else {
              filterClinicName = selectedClinic
            }
          }

          const filteredDebriefs = debriefs
            .filter((debrief: any) => {
              const weekEnding = debrief.week_ending || debrief.weekEnding
              if (!weekEnding) return false

              const matchesWeek = !selectedWeek || weekEnding === selectedWeek

              const clinic = debrief.clinic || ""
              const normalizedClinic = clinic.toLowerCase().replace(" clinic", "").trim()
              const normalizedFilter = filterClinicName.toLowerCase().replace(" clinic", "").trim()
              const matchesClinic = filterClinicName === "all" || normalizedClinic === normalizedFilter

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
  }, [selectedWeek, selectedClinic, directors])

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
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span>Active Students</span>
                <Badge
                  variant="secondary"
                  className="ml-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                >
                  {uniqueStudents.length}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                {!isOpen && uniqueStudents.length > 3 && (
                  <span className="text-sm text-muted-foreground">+{uniqueStudents.length - 3} more</span>
                )}
                <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
              </div>
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
                  <StudentCard
                    key={index}
                    student={student}
                    isExpanded={expandedStudents.has(student.name)}
                    onToggle={() => toggleStudent(student.name)}
                  />
                ))}
              </div>

              <CollapsibleContent>
                <div className="mt-2 space-y-2">
                  {uniqueStudents.slice(3).map((student, index) => (
                    <StudentCard
                      key={index + 3}
                      student={student}
                      isExpanded={expandedStudents.has(student.name)}
                      onToggle={() => toggleStudent(student.name)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </>
          )}
        </CardContent>
      </Collapsible>
    </Card>
  )
}

interface StudentCardProps {
  student: {
    name: string
    id?: string
    totalHours: number
    clinic: string
    debriefs: StudentDebrief[]
  }
  isExpanded: boolean
  onToggle: () => void
}

function StudentCard({ student, isExpanded, onToggle }: StudentCardProps) {
  const clinicColor = getClinicColor(student.clinic)

  return (
    <div
      className="rounded-lg border bg-card transition-all duration-200 hover:shadow-sm"
      style={{ borderLeftWidth: "3px", borderLeftColor: clinicColor.hex }}
    >
      <Button variant="ghost" className="w-full justify-between p-3 h-auto" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
          {student.id ? (
            <StakeholderContactCard type="student" id={student.id} name={student.name} variant="compact" />
          ) : (
            <span className="font-medium">{student.name}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs" style={{ borderColor: clinicColor.hex, color: clinicColor.hex }}>
            {student.clinic}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {student.totalHours}h
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            {student.debriefs.length}
          </div>
        </div>
      </Button>

      {isExpanded && (
        <div className="px-4 pb-3 pt-0 space-y-3 border-t bg-muted/30">
          <div className="text-xs font-medium text-muted-foreground pt-3">Debrief Details</div>
          {student.debriefs.map((debrief, idx) => (
            <div key={idx} className="space-y-1.5 p-2 rounded bg-background">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {debrief.client}
                </Badge>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{debrief.hours}h</span>
                  <span>{new Date(debrief.dateSubmitted).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">{debrief.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
