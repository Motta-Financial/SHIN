"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ChevronDown, ChevronRight, Mail } from "lucide-react"
import { getClinicColor } from "@/lib/clinic-colors"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface InactiveStudentsProps {
  selectedWeek: string
  selectedClinic: string
}

interface Student {
  name: string
  clinic: string
  role: string
}

export function InactiveStudents({ selectedWeek, selectedClinic }: InactiveStudentsProps) {
  const [inactiveStudents, setInactiveStudents] = useState<Student[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [debriefsRes, rosterRes] = await Promise.all([
          fetch("/api/supabase/debriefs"),
          fetch("/api/supabase/roster"),
        ])

        const debriefsData = debriefsRes.ok ? await debriefsRes.json() : { debriefs: [] }
        const rosterData = rosterRes.ok ? await rosterRes.json() : { students: [] }

        const debriefs = debriefsData.debriefs || []
        const roster = rosterData.students || []

        const allStudents = roster
          .map((record: any) => {
            const name = record.fullName || record.full_name || ""
            const clinic = record.clinic || ""
            const role = record.status || "Student"
            return { name, clinic, role }
          })
          .filter((student: any) => student.name && student.clinic)

        const activeStudentNames = new Set<string>()

        debriefs.forEach((debrief: any) => {
          const weekEnding = debrief.weekEnding || debrief.week_ending
          const studentName = debrief.studentName || debrief.student_name

          if (!weekEnding) return

          const matchesWeek = !selectedWeek || weekEnding === selectedWeek

          if (matchesWeek && studentName) {
            activeStudentNames.add(studentName.trim())
          }
        })

        let inactive = allStudents.filter((student: Student) => !activeStudentNames.has(student.name.trim()))

        if (selectedClinic !== "all") {
          inactive = inactive.filter((student: Student) => {
            const studentClinic = student.clinic.toLowerCase()
            const filterClinic = selectedClinic.toLowerCase()
            return studentClinic.includes(filterClinic) || filterClinic.includes(studentClinic)
          })
        }

        setInactiveStudents(inactive)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedWeek, selectedClinic])

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

  if (loading) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="text-sm text-muted-foreground">Loading inactive students...</div>
        </CardContent>
      </Card>
    )
  }

  const previewCount = 3
  const previewStudents = inactiveStudents.slice(0, previewCount)
  const remainingCount = Math.max(0, inactiveStudents.length - previewCount)

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span>Inactive Students</span>
                <Badge
                  variant="secondary"
                  className="ml-2 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                >
                  {inactiveStudents.length}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                {!isOpen && remainingCount > 0 && (
                  <span className="text-sm text-muted-foreground">+{remainingCount} more</span>
                )}
                <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CardContent>
          {inactiveStudents.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <span>All students have submitted their debriefs!</span>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {previewStudents.map((student, index) => (
                  <InactiveStudentCard
                    key={index}
                    student={student}
                    isExpanded={expandedStudents.has(student.name)}
                    onToggle={() => toggleStudent(student.name)}
                  />
                ))}
              </div>

              <CollapsibleContent>
                <div className="mt-2 space-y-2">
                  {inactiveStudents.slice(3).map((student, index) => (
                    <InactiveStudentCard
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

interface InactiveStudentCardProps {
  student: Student
  isExpanded: boolean
  onToggle: () => void
}

function InactiveStudentCard({ student, isExpanded, onToggle }: InactiveStudentCardProps) {
  const clinicColor = getClinicColor(student.clinic)

  return (
    <div
      className="rounded-lg border bg-card transition-all duration-200 hover:shadow-sm"
      style={{ borderLeftWidth: "3px", borderLeftColor: clinicColor.hex }}
    >
      <Button variant="ghost" className="w-full justify-between p-3 h-auto" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
          <div className="text-left">
            <div className="font-medium">{student.name}</div>
            <div className="text-xs text-muted-foreground">{student.role}</div>
          </div>
        </div>
        <Badge variant="outline" className="text-xs" style={{ borderColor: clinicColor.hex, color: clinicColor.hex }}>
          {student.clinic}
        </Badge>
      </Button>

      {isExpanded && (
        <div className="px-4 pb-3 pt-0 space-y-2 border-t bg-muted/30">
          <div className="text-xs font-medium text-muted-foreground pt-3">No debrief submitted this week</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs bg-transparent">
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              Send Reminder
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
