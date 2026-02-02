"use client"

import { Card } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { ChevronRight, X } from "lucide-react"
import { getClinicColor } from "@/lib/clinic-colors"
import Link from "next/link"
import { useDirectors } from "@/hooks/use-directors"

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

interface StudentHoursProps {
  selectedWeeks: string[]
  selectedClinic: string
}

export function StudentHours({ selectedWeeks, selectedClinic }: StudentHoursProps) {
  const [data, setData] = useState<StudentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<"clinic" | "client">("clinic")
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null)
  const { directors } = useDirectors()

  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return ""
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return date.toISOString().split("T")[0]
    } catch {
      return dateStr
    }
  }

  useEffect(() => {
    async function fetchHoursData() {
      try {
        console.log("[v0] StudentHours - selectedWeeks:", selectedWeeks)
        const debriefsRes = await fetch("/api/supabase/debriefs")

        if (!debriefsRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const debriefsData = await debriefsRes.json()

        const debriefs = debriefsData.debriefs || []
        console.log("[v0] StudentHours - Fetched debriefs count:", debriefs.length)
        if (debriefs.length > 0) {
          console.log("[v0] StudentHours - First debrief weekEnding:", debriefs[0].weekEnding || debriefs[0].week_ending)
        }

        const studentMap = new Map<string, StudentSummary>()

        let filterClinicName = "all"
        if (selectedClinic && selectedClinic !== "all") {
          const isUUID = selectedClinic.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
          if (isUUID) {
            const director = directors.find((d) => d.id === selectedClinic)
            if (director?.clinic) {
              filterClinicName = director.clinic
            }
          } else {
            filterClinicName = selectedClinic
          }
        }

        debriefs.forEach((debrief: any) => {
          const recordWeek = normalizeDate(debrief.weekEnding || debrief.week_ending || "")
          const studentClinic = debrief.clinic || "Unknown"
          const studentName = debrief.studentName || debrief.student_name || "Unknown Student"
          const clientName = debrief.clientName || debrief.client_name || "No Client"
          const hours = Number.parseFloat(debrief.hoursWorked || debrief.hours_worked || "0")
          const workSummary = debrief.workSummary || debrief.work_summary || "No summary provided"

          const normalizedStudentClinic = studentClinic.toLowerCase().replace(" clinic", "").trim()
          const normalizedFilterClinic = filterClinicName.toLowerCase().replace(" clinic", "").trim()

          const matchesClinic = filterClinicName === "all" || normalizedStudentClinic === normalizedFilterClinic

          const matchesWeek = selectedWeeks.length === 0 || selectedWeeks.some((sw) => normalizeDate(sw) === recordWeek)

          console.log("[v0] StudentHours - Checking debrief:", { recordWeek, matchesWeek, matchesClinic, studentName })

          if (!matchesWeek || !matchesClinic) {
            return
          }

          if (!studentMap.has(studentName)) {
            studentMap.set(studentName, {
              name: studentName,
              totalHours: 0,
              clinic: studentClinic,
              client: clientName,
              records: [],
            })
          }

          const student = studentMap.get(studentName)!
          student.totalHours += hours
          student.records.push({
            weekEnding: recordWeek,
            hours,
            workSummary,
            client: clientName,
          })
        })

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
  }, [selectedWeeks, selectedClinic, directors])

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

  const maxDisplay = 10
  const hasMoreStudents = data.length > maxDisplay

  if (loading) {
    return (
      <Card className="p-4 bg-white border-[#002855]/20 shadow-lg">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#002855]">Student Hours Summary</h2>
          <p className="text-xs text-[#002855]/70">Hours breakdown by student</p>
        </div>
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0077B6]"></div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="p-4 bg-gradient-to-br from-blue-500/5 via-blue-400/5 to-blue-600/5 border border-blue-200/50 shadow-lg backdrop-blur-sm">
        <div className="mb-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-[#002855]">Student Hours Summary</h2>
              <p className="text-xs text-[#002855]/70">Click on a student to view detailed records</p>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-2 shadow-md text-center border border-blue-300/50">
              <p className="text-xl font-bold text-blue-700">{totalHours.toFixed(1)}</p>
              <p className="text-xs text-blue-600">Total Hours</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <label className="text-xs font-medium text-[#002855]">Group by:</label>
            <button
              onClick={() => setGroupBy("clinic")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                groupBy === "clinic"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-blue-100/50 text-blue-700 border border-blue-200 hover:bg-blue-200/50"
              }`}
            >
              Clinic
            </button>
            <button
              onClick={() => setGroupBy("client")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                groupBy === "client"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-blue-100/50 text-blue-700 border border-blue-200 hover:bg-blue-200/50"
              }`}
            >
              Client
            </button>
          </div>
        </div>

        {Object.keys(groupedData).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(groupedData)
              .slice(0, maxDisplay)
              .map(([groupName, students]) => {
                const groupTotal = students.reduce((sum, s) => sum + s.totalHours, 0)
                const colors = groupBy === "clinic" ? getClinicColor(groupName) : { hex: "#0077B6", bg: "bg-[#0077B6]" }

                return (
                  <div
                    key={groupName}
                    className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md border"
                    style={{ borderColor: colors.hex }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
                        <h3 className="text-sm font-bold text-[#002855]">{groupName}</h3>
                      </div>
                      <span className="text-xs font-medium" style={{ color: colors.hex }}>
                        {groupTotal.toFixed(1)} hours total
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {students.map((student) => (
                        <button
                          key={student.name}
                          onClick={() => setSelectedStudent(student)}
                          className="w-full flex items-center justify-between p-2 rounded-lg bg-white border hover:shadow-md transition-all group"
                          style={{ borderColor: `${colors.hex}30` }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = colors.hex
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = `${colors.hex}30`
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center text-white font-bold text-sm`}
                            >
                              {student.name.charAt(0)}
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-[#002855] text-sm">{student.name}</p>
                              <p className="text-xs text-[#002855]/70">
                                {student.records.length} {student.records.length === 1 ? "entry" : "entries"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-bold" style={{ color: colors.hex }}>
                              {student.totalHours.toFixed(1)}h
                            </span>
                            <ChevronRight
                              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                              style={{ color: colors.hex }}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            {hasMoreStudents && (
              <Link href="/student-hours" className="block">
                <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2">
                  <span>View All Students ({data.length})</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-[#002855]/50 text-sm">No hours data available for selected filters</p>
          </div>
        )}
      </Card>

      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col bg-white">
            <div className="p-6 border-b border-[#002855]/20 flex items-center justify-between bg-[#002855]">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedStudent.name}</h2>
                <p className="text-sm text-white/80">
                  Total: {selectedStudent.totalHours.toFixed(1)} hours • {selectedStudent.records.length}{" "}
                  {selectedStudent.records.length === 1 ? "entry" : "entries"}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {selectedStudent.records
                  .sort((a, b) => new Date(b.weekEnding).getTime() - new Date(a.weekEnding).getTime())
                  .map((record, index) => (
                    <div
                      key={index}
                      className="border-2 border-[#0077B6]/30 rounded-lg p-4 hover:border-[#0077B6] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-[#002855]">{record.client}</p>
                          <p className="text-sm text-[#002855]/70">
                            Week ending:{" "}
                            {new Date(record.weekEnding).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-[#0077B6]">{record.hours}h</span>
                      </div>
                      <p className="text-sm text-[#002855]/80 leading-relaxed">{record.workSummary}</p>
                    </div>
                  ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
