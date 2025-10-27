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
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch roster data
        const rosterResponse = await fetch("/api/airtable/roster")
        const rosterData = await rosterResponse.json()

        // Fetch debrief submissions
        const debriefsResponse = await fetch("/api/airtable/debriefs")
        const debriefsData = await debriefsResponse.json()

        if (!rosterData.records || !debriefsData.records) {
          console.error("[v0] Missing data:", { roster: !!rosterData.records, debriefs: !!debriefsData.records })
          return
        }

        const allStudents = rosterData.records
          .map((record: any) => {
            const fields = record.fields
            const name = fields["NAME"] || ""
            const role = fields["ROLE"] || ""
            const clinic = fields["Related Clinic"] || ""
            const clinicRole = fields["Clinic| Role"] || ""

            return { name, clinic, role, clinicRole }
          })
          .filter((student: any) => student.name && student.clinic && student.clinicRole === "Student")
          .map((student: any) => ({ name: student.name, clinic: student.clinic, role: student.role }))

        // Get students who submitted debriefs for the selected week
        const activeStudentNames = new Set<string>()

        debriefsData.records.forEach((record: any) => {
          const fields = record.fields
          const dateSubmitted = fields["Date Submitted"]
          const studentNames = fields["NAME (from SEED | Students)"]

          if (!dateSubmitted || !studentNames) return

          // Check if submission is for the selected week
          const submissionDate = new Date(dateSubmitted)
          const weekEnd = new Date(selectedWeek)
          const weekStart = new Date(weekEnd)
          weekStart.setDate(weekStart.getDate() - 6)

          if (submissionDate >= weekStart && submissionDate <= weekEnd) {
            // Add student names to active set
            if (Array.isArray(studentNames)) {
              studentNames.forEach((name: string) => {
                if (name) activeStudentNames.add(name.trim())
              })
            }
          }
        })

        // Find inactive students (in roster but didn't submit)
        let inactive = allStudents.filter((student: Student) => {
          const isActive = activeStudentNames.has(student.name) || activeStudentNames.has(student.name.trim())
          return !isActive
        })

        // Filter by clinic if not "all"
        if (selectedClinic !== "all") {
          inactive = inactive.filter((student: Student) => {
            const studentClinic = student.clinic.toLowerCase()
            const filterClinic = selectedClinic.toLowerCase()
            return studentClinic.includes(filterClinic) || filterClinic.includes(studentClinic)
          })
        }

        setInactiveStudents(inactive)
      } catch (error) {
        console.error("[v0] Error fetching inactive students:", error)
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
              <div className="text-sm text-muted-foreground">All students have submitted their debriefs this week!</div>
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
