"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
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
    <Card>
      <CardContent className="py-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <div className="font-semibold text-sm">
                  {inactiveStudents.length} Inactive Student{inactiveStudents.length !== 1 ? "s" : ""}
                </div>
                {inactiveStudents.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {previewStudents.map((s) => s.name).join(", ")}
                    {remainingCount > 0 && ` +${remainingCount} more`}
                  </div>
                )}
              </div>
            </div>
            {inactiveStudents.length > 0 && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            )}
          </div>

          <CollapsibleContent className="mt-4">
            {inactiveStudents.length === 0 ? (
              <div className="text-sm text-muted-foreground">All students have submitted their debriefs!</div>
            ) : (
              <div className="space-y-2">
                {inactiveStudents.map((student, index) => {
                  const clinicColor = getClinicColor(student.clinic)
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: clinicColor.hex }}
                          title={student.clinic}
                        />
                        <div>
                          <div className="text-sm font-medium">{student.name}</div>
                          <div className="text-xs text-muted-foreground">{student.role}</div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: clinicColor.hex, color: clinicColor.hex }}
                      >
                        {student.clinic}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
