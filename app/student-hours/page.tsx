"use client"

import { Card } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { ChevronRight, X, ArrowLeft } from "lucide-react"
import { getClinicColor } from "@/lib/clinic-colors"
import Link from "next/link"
import { MainNavigation } from "@/components/main-navigation"

interface DebriefRecord {
  weekEnding: string
  hours: number
  workSummary: string
  client: string
}

interface StudentSummary {
  name: string
  totalHours: number
  clinic: string
  client: string
  records: DebriefRecord[]
}

export default function StudentHoursPage() {
  const [data, setData] = useState<StudentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<"clinic" | "client">("clinic")
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<string>("")
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])

  const directorToClinicMap = new Map<string, string>([
    ["Mark Dwyer", "Accounting"],
    ["Nick Vadala", "Consulting"],
    ["Ken Mooney", "Funding"],
    ["Christopher Hill", "Marketing"],
    ["Chris Hill", "Marketing"],
    ["Beth DiRusso", "Funding"],
  ])

  const roleToClinicMap = new Map<string, string>([
    ["ACCTING CLINIC", "Accounting"],
    ["ACCOUNTING CLINIC", "Accounting"],
    ["CONSULTING CLINIC", "Consulting"],
    ["RESOURCE CLINIC", "Funding"],
    ["RESOURCE ACQUISITION", "Funding"],
    ["MARKETING CLINIC", "Marketing"],
  ])

  useEffect(() => {
    async function fetchHoursData() {
      try {
        const debriefsRes = await fetch("/api/supabase/debriefs")

        if (!debriefsRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const debriefsData = await debriefsRes.json()

        const weekSet = new Set<string>()
        const studentMap = new Map<string, StudentSummary>()

        if (debriefsData.debriefs) {
          debriefsData.debriefs.forEach((debrief: any) => {
            const weekEnding = debrief.weekEnding || ""

            if (weekEnding) {
              weekSet.add(weekEnding)
            }

            if (!selectedWeek || weekEnding === selectedWeek) {
              const studentName = debrief.studentName || "Unknown Student"
              const studentClinic = debrief.clinic || "Unknown"
              const client = debrief.clientName || "No Client"
              const hours = debrief.hoursWorked || 0
              const workSummary = debrief.workSummary || "No summary provided"

              if (!studentMap.has(studentName)) {
                studentMap.set(studentName, {
                  name: studentName,
                  totalHours: 0,
                  clinic: studentClinic,
                  client,
                  records: [],
                })
              }

              const student = studentMap.get(studentName)!
              student.totalHours += hours
              student.records.push({
                weekEnding,
                hours,
                workSummary,
                client,
              })
            }
          })
        }

        const weeks = Array.from(weekSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        setAvailableWeeks(weeks)
        if (weeks.length > 0 && !selectedWeek) {
          setSelectedWeek(weeks[0])
        }

        const studentsArray = Array.from(studentMap.values())
        studentsArray.sort((a, b) => b.totalHours - a.totalHours)

        setData(studentsArray)
      } catch (error) {
        console.error("Error fetching student hours:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchHoursData()
  }, [selectedWeek])

  const totalHours = data.reduce((sum, student) => sum + student.totalHours, 0)

  const groupedData = data.reduce(
    (acc, student) => {
      const key = groupBy === "clinic" ? student.clinic : student.client
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(student)
      return acc
    },
    {} as Record<string, StudentSummary[]>,
  )

  return (
    <div className="min-h-screen bg-background pt-[41px] pl-12">
      <MainNavigation />

      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Link href="/?tab=students" className="inline-flex items-center gap-2 text-primary hover:underline mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Student Hours - Full View</h1>
              <p className="text-muted-foreground">Detailed breakdown of all student hours</p>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-background"
              >
                <option value="">All Weeks</option>
                {availableWeeks.map((week) => (
                  <option key={week} value={week}>
                    Week ending {new Date(week).toLocaleDateString()}
                  </option>
                ))}
              </select>

              <div className="bg-primary/10 rounded-lg p-4 text-center border border-primary/20">
                <p className="text-2xl font-bold text-primary">{totalHours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Total Hours</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <label className="text-sm font-medium">Group by:</label>
              <button
                onClick={() => setGroupBy("clinic")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  groupBy === "clinic"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Clinic
              </button>
              <button
                onClick={() => setGroupBy("client")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  groupBy === "client"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Client
              </button>
            </div>

            {Object.keys(groupedData).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedData).map(([groupName, students]) => {
                  const groupTotal = students.reduce((sum, s) => sum + s.totalHours, 0)
                  const colors =
                    groupBy === "clinic" ? getClinicColor(groupName) : { hex: "#0077B6", bg: "bg-[#0077B6]" }

                  return (
                    <div
                      key={groupName}
                      className="bg-card rounded-lg p-6 shadow-md border-2"
                      style={{ borderColor: colors.hex }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                          <h3 className="text-xl font-bold text-foreground">{groupName}</h3>
                        </div>
                        <span className="text-lg font-bold" style={{ color: colors.hex }}>
                          {groupTotal.toFixed(1)} hours total
                        </span>
                      </div>
                      <div className="space-y-3">
                        {students.map((student) => (
                          <button
                            key={student.name}
                            onClick={() => setSelectedStudent(student)}
                            className="w-full flex items-center justify-between p-4 rounded-lg bg-background border-2 hover:shadow-lg transition-all group"
                            style={{ borderColor: `${colors.hex}30` }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = colors.hex
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = `${colors.hex}30`
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center text-white font-bold text-lg`}
                              >
                                {student.name.charAt(0)}
                              </div>
                              <div className="text-left">
                                <p className="font-semibold text-foreground text-base">{student.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {student.records.length} {student.records.length === 1 ? "entry" : "entries"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold" style={{ color: colors.hex }}>
                                {student.totalHours.toFixed(1)}h
                              </span>
                              <ChevronRight
                                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                                style={{ color: colors.hex }}
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No hours data available</p>
              </div>
            )}
          </Card>
        )}
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between bg-primary">
              <div>
                <h2 className="text-2xl font-bold text-primary-foreground">{selectedStudent.name}</h2>
                <p className="text-sm text-primary-foreground/80">
                  Total: {selectedStudent.totalHours.toFixed(1)} hours • {selectedStudent.records.length}{" "}
                  {selectedStudent.records.length === 1 ? "entry" : "entries"}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-lg hover:bg-primary-foreground/20 transition-colors"
              >
                <X className="w-6 h-6 text-primary-foreground" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {selectedStudent.records
                  .sort((a, b) => new Date(b.weekEnding).getTime() - new Date(a.weekEnding).getTime())
                  .map((record, index) => (
                    <div
                      key={index}
                      className="border-2 border-primary/30 rounded-lg p-4 hover:border-primary transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-foreground">{record.client}</p>
                          <p className="text-sm text-muted-foreground">
                            Week ending:{" "}
                            {new Date(record.weekEnding).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-primary">{record.hours}h</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{record.workSummary}</p>
                    </div>
                  ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
