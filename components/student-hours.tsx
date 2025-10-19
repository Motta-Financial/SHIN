"use client"

import { Card } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { ChevronRight, X } from "lucide-react"
import { getClinicColor } from "@/lib/clinic-colors"

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
  selectedWeek: string
}

export function StudentHours({ selectedWeek }: StudentHoursProps) {
  const [data, setData] = useState<StudentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<"clinic" | "client">("clinic")
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null)

  useEffect(() => {
    async function fetchHoursData() {
      try {
        const debriefsRes = await fetch("/api/airtable/debriefs")

        if (!debriefsRes.ok) {
          throw new Error("Failed to fetch debriefs")
        }

        const debriefsData = await debriefsRes.json()

        console.log("[v0] Student Hours - Total debrief records:", debriefsData.records?.length || 0)
        console.log("[v0] Student Hours - Selected week:", selectedWeek)

        const studentMap = new Map<string, StudentSummary>()
        let filteredRecordsCount = 0

        if (debriefsData.records) {
          debriefsData.records.forEach((record: any) => {
            const fields = record.fields

            const weekEnding = fields["END DATE (from WEEK (from SEED | Schedule))"]
              ? Array.isArray(fields["END DATE (from WEEK (from SEED | Schedule))"])
                ? fields["END DATE (from WEEK (from SEED | Schedule))"][0]
                : fields["END DATE (from WEEK (from SEED | Schedule))"]
              : null

            const dateSubmitted = fields["Date Submitted"]

            // Determine the week for this record
            let recordWeek = ""
            if (weekEnding) {
              recordWeek = weekEnding
            } else if (dateSubmitted) {
              const date = new Date(dateSubmitted)
              const day = date.getDay()
              const diff = 6 - day
              const weekEndingDate = new Date(date)
              weekEndingDate.setDate(date.getDate() + diff)
              recordWeek = weekEndingDate.toISOString().split("T")[0]
            }

            // Only include records from the selected week
            if (recordWeek !== selectedWeek) {
              return
            }

            filteredRecordsCount++

            const studentName = fields["NAME (from SEED | Students)"]
              ? Array.isArray(fields["NAME (from SEED | Students)"])
                ? fields["NAME (from SEED | Students)"][0]
                : fields["NAME (from SEED | Students)"]
              : fields["Student Name"] || "Unknown Student"

            const client = fields["Client"] || "No Client"
            const clinic = fields["Related Clinic"] || "No Clinic"
            const hours = Number.parseFloat(fields["Number of Hours Worked"] || "0")
            const workSummary = fields["Summary of Work"] || "No summary provided"

            if (!studentMap.has(studentName)) {
              studentMap.set(studentName, {
                name: studentName,
                totalHours: 0,
                clinic,
                client,
                records: [],
              })
            }

            const student = studentMap.get(studentName)!
            student.totalHours += hours
            student.records.push({
              weekEnding: recordWeek,
              hours,
              workSummary,
              client,
            })
          })
        }

        console.log("[v0] Student Hours - Filtered records for week:", filteredRecordsCount)
        console.log("[v0] Student Hours - Unique students:", studentMap.size)

        const studentsArray = Array.from(studentMap.values())
        studentsArray.sort((a, b) => b.totalHours - a.totalHours)

        console.log(
          "[v0] Student Hours - Final data:",
          studentsArray.map((s) => ({ name: s.name, hours: s.totalHours, clinic: s.clinic })),
        )
        setData(studentsArray)
      } catch (error) {
        console.error("[v0] Error fetching student hours:", error)
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

  if (loading) {
    return (
      <Card className="p-6 bg-white border-[#002855]/20 shadow-lg">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#002855]">Student Hours Summary</h2>
          <p className="text-sm text-[#002855]/70">Hours breakdown by student</p>
        </div>
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0077B6]"></div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="p-6 bg-white border-[#002855]/20 shadow-lg">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-[#002855]">Student Hours Summary</h2>
              <p className="text-sm text-[#002855]/70">Click on a student to view detailed records</p>
            </div>
            <div className="bg-[#002855] rounded-lg p-3 shadow-md text-center">
              <p className="text-2xl font-bold text-white">{totalHours.toFixed(1)}</p>
              <p className="text-xs text-white/80">Total Hours</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <label className="text-sm font-medium text-[#002855]">Group by:</label>
            <button
              onClick={() => setGroupBy("clinic")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                groupBy === "clinic"
                  ? "bg-[#0077B6] text-white"
                  : "bg-white text-[#002855] border-2 border-[#0077B6] hover:bg-[#0077B6]/10"
              }`}
            >
              Clinic
            </button>
            <button
              onClick={() => setGroupBy("client")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                groupBy === "client"
                  ? "bg-[#0077B6] text-white"
                  : "bg-white text-[#002855] border-2 border-[#0077B6] hover:bg-[#0077B6]/10"
              }`}
            >
              Client
            </button>
          </div>
        </div>

        {Object.keys(groupedData).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedData).map(([groupName, students]) => {
              const groupTotal = students.reduce((sum, s) => sum + s.totalHours, 0)
              const colors = groupBy === "clinic" ? getClinicColor(groupName) : { hex: "#0077B6", bg: "bg-[#0077B6]" }

              return (
                <div key={groupName} className={`border-2 rounded-lg p-4`} style={{ borderColor: colors.hex }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                      <h3 className="text-lg font-bold text-[#002855]">{groupName}</h3>
                    </div>
                    <span className="text-sm font-medium" style={{ color: colors.hex }}>
                      {groupTotal.toFixed(1)} hours total
                    </span>
                  </div>
                  <div className="space-y-2">
                    {students.map((student) => (
                      <button
                        key={student.name}
                        onClick={() => setSelectedStudent(student)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-white border-2 hover:shadow-md transition-all group"
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
                            className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center text-white font-bold`}
                          >
                            {student.name.charAt(0)}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-[#002855]">{student.name}</p>
                            <p className="text-xs text-[#002855]/70">
                              {student.records.length} {student.records.length === 1 ? "entry" : "entries"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold" style={{ color: colors.hex }}>
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
            <p className="text-[#002855]/70">No hours data available</p>
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
