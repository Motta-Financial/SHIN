"use client"

import { Card } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { getClinicColor } from "@/lib/clinic-colors"

interface PerformanceData {
  name: string
  hours: number
  students: number
  clients: number
}

interface WorkEntry {
  student: string
  clinic: string
  client: string
  summary: string
  hours: number
}

interface ClinicPerformanceProps {
  selectedWeek: string
}

export function ClinicPerformance({ selectedWeek }: ClinicPerformanceProps) {
  const [data, setData] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"clinic" | "client">("clinic")
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([])
  const [clientSummaries, setClientSummaries] = useState<Map<string, string>>(new Map())
  const [generatingSummaries, setGeneratingSummaries] = useState(false)

  useEffect(() => {
    async function fetchClinicData() {
      try {
        const [clientsRes, debriefsRes] = await Promise.all([
          fetch("/api/airtable/clients"),
          fetch("/api/airtable/debriefs"),
        ])

        if (!clientsRes.ok || !debriefsRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const clientsData = await clientsRes.json()
        const debriefsData = await debriefsRes.json()

        console.log("[v0] Clinic Performance - Total debrief records:", debriefsData.records?.length || 0)
        console.log("[v0] Clinic Performance - Selected week:", selectedWeek)

        const workSummaries: string[] = []
        const entries: WorkEntry[] = []

        if (view === "clinic") {
          const clinicMap = new Map<string, PerformanceData>()
          const clinicNames = ["Consulting", "Accounting", "Funding", "Marketing"]

          clinicNames.forEach((name) => {
            clinicMap.set(name, {
              name: name,
              hours: 0,
              students: 0,
              clients: 0,
            })
          })

          const studentsByClinic = new Map<string, Set<string>>()
          const clientsByClinic = new Map<string, Set<string>>()
          let filteredRecordsCount = 0

          if (debriefsData.records) {
            debriefsData.records.forEach((record: any) => {
              const fields = record.fields
              const weekEnding = fields["END DATE (from WEEK (from SEED | Schedule))"]
              const dateSubmitted = fields["Date Submitted"]

              let recordWeek = ""
              if (weekEnding) {
                recordWeek = Array.isArray(weekEnding) ? weekEnding[0] : weekEnding
              } else if (dateSubmitted) {
                const date = new Date(dateSubmitted)
                const day = date.getDay()
                const diff = 6 - day
                const weekEndingDate = new Date(date)
                weekEndingDate.setDate(date.getDate() + diff)
                recordWeek = weekEndingDate.toISOString().split("T")[0]
              }

              if (recordWeek === selectedWeek) {
                filteredRecordsCount++

                const clinicField = fields["Related Clinic"]
                const studentNameField = fields["NAME (from SEED | Students)"]
                const studentName = Array.isArray(studentNameField) ? studentNameField[0] : studentNameField
                const hours = Number.parseFloat(fields["Number of Hours Worked"] || "0")
                const workSummary = fields["Summary of Work"]
                const clientField = fields["Client"]
                const clientName = Array.isArray(clientField) ? clientField[0] : clientField || "No Client"

                if (workSummary && studentName) {
                  entries.push({
                    student: studentName,
                    clinic: clinicField || "Unknown Clinic",
                    client: clientName,
                    summary: workSummary,
                    hours: hours,
                  })
                }

                if (clinicField) {
                  const clinicValue = Array.isArray(clinicField) ? clinicField[0] : clinicField

                  clinicNames.forEach((name) => {
                    if (clinicValue.includes(name)) {
                      const clinic = clinicMap.get(name)
                      if (clinic) {
                        clinic.hours += hours

                        if (!studentsByClinic.has(name)) {
                          studentsByClinic.set(name, new Set())
                        }
                        if (studentName) {
                          studentsByClinic.get(name)!.add(studentName)
                        }

                        if (!clientsByClinic.has(name)) {
                          clientsByClinic.set(name, new Set())
                        }
                        if (clientName && clientName !== "No Client") {
                          clientsByClinic.get(name)!.add(clientName)
                        }
                      }
                    }
                  })
                }
              }
            })
          }

          studentsByClinic.forEach((students, clinicName) => {
            const clinic = clinicMap.get(clinicName)
            if (clinic) {
              clinic.students = students.size
            }
          })

          clientsByClinic.forEach((clients, clinicName) => {
            const clinic = clinicMap.get(clinicName)
            if (clinic) {
              clinic.clients = clients.size
            }
          })

          const finalData = Array.from(clinicMap.values())
          console.log("[v0] Clinic Performance - Final data:", finalData)
          setData(finalData)
        } else {
          const clientMap = new Map<string, PerformanceData>()

          if (debriefsData.records) {
            debriefsData.records.forEach((record: any) => {
              const fields = record.fields
              const weekEnding = fields["END DATE (from WEEK (from SEED | Schedule))"]
              const dateSubmitted = fields["Date Submitted"]

              let recordWeek = ""
              if (weekEnding) {
                recordWeek = Array.isArray(weekEnding) ? weekEnding[0] : weekEnding
              } else if (dateSubmitted) {
                const date = new Date(dateSubmitted)
                const day = date.getDay()
                const diff = 6 - day
                const weekEndingDate = new Date(date)
                weekEndingDate.setDate(date.getDate() + diff)
                recordWeek = weekEndingDate.toISOString().split("T")[0]
              }

              if (recordWeek === selectedWeek) {
                const clientField = fields["Client"]
                const clientName = Array.isArray(clientField) ? clientField[0] : clientField || "No Client"
                const studentNameField = fields["NAME (from SEED | Students)"]
                const studentName = Array.isArray(studentNameField) ? studentNameField[0] : studentNameField
                const hours = Number.parseFloat(fields["Number of Hours Worked"] || "0")
                const workSummary = fields["Summary of Work"]
                const clinicField = fields["Related Clinic"]

                if (workSummary && studentName) {
                  entries.push({
                    student: studentName,
                    clinic: clinicField || "Unknown Clinic",
                    client: clientName,
                    summary: workSummary,
                    hours: hours,
                  })
                }

                if (!clientMap.has(clientName)) {
                  clientMap.set(clientName, {
                    name: clientName,
                    hours: 0,
                    students: 0,
                    clients: 1,
                  })
                }

                const client = clientMap.get(clientName)!
                client.hours += hours

                if (studentName) {
                  const studentSet = new Set<string>()
                  clientMap.forEach((c) => {
                    if (c.name === clientName) {
                      studentSet.add(studentName)
                    }
                  })
                  client.students = studentSet.size
                }
              }
            })
          }

          const clientsArray = Array.from(clientMap.values())
          clientsArray.sort((a, b) => b.hours - a.hours)
          setData(clientsArray.slice(0, 10))
        }

        setWorkEntries(entries)
      } catch (error) {
        console.error("[v0] Error fetching clinic performance:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchClinicData()
  }, [selectedWeek, view])

  useEffect(() => {
    async function generateSummaries() {
      if (workEntries.length === 0) return

      setGeneratingSummaries(true)
      const summariesMap = new Map<string, string>()

      const byClient = new Map<string, WorkEntry[]>()
      workEntries.forEach((entry) => {
        if (!byClient.has(entry.client)) {
          byClient.set(entry.client, [])
        }
        byClient.get(entry.client)!.push(entry)
      })

      for (const [client, entries] of byClient.entries()) {
        const students = [...new Set(entries.map((e) => e.student).filter((s) => s && typeof s === "string"))]
        const workSummaries = entries
          .map((e) => e.summary)
          .filter((s) => s && typeof s === "string" && s.trim().length > 10)

        if (workSummaries.length > 0 && students.length > 0) {
          try {
            // Try AI generation first
            const { generateClientSummary } = await import("@/app/actions/generate-client-summary")
            const aiSummary = await generateClientSummary(client, workSummaries, students)
            summariesMap.set(client, aiSummary)
          } catch (error) {
            console.error(`[v0] AI generation failed for ${client}, using fallback:`, error)
            // Use fallback if AI fails
            const fallbackSummary = createFallbackSummary(workSummaries, students)
            summariesMap.set(client, fallbackSummary)
          }
        }
      }

      setClientSummaries(summariesMap)
      setGeneratingSummaries(false)
    }

    generateSummaries()
  }, [workEntries])

  const createFallbackSummary = (workSummaries: string[], students: string[]): string => {
    // Clean summaries: remove hours, numbers, and poorly formatted text
    const cleanedSummaries = workSummaries
      .filter((s) => s && typeof s === "string") // Filter out null/undefined first
      .map((s) => {
        return s
          .replace(/\b\d+(\.\d+)?\s*(hours?|hrs?)\b/gi, "") // Remove hour mentions
          .replace(/^\d+(\.\d+)?$/, "") // Remove standalone numbers
          .replace(/\s+/g, " ") // Normalize whitespace
          .trim()
      })
      .filter((s) => s && s.length > 10) // Filter out very short entries and empty strings
      .filter((s, idx, arr) => arr.indexOf(s) === idx) // Remove duplicates

    if (cleanedSummaries.length === 0) {
      return "Team members worked on various client activities this week."
    }

    const studentList =
      students.length > 1 ? `${students.slice(0, -1).join(", ")} and ${students[students.length - 1]}` : students[0]

    if (cleanedSummaries.length === 1) {
      const summary = cleanedSummaries[0]
      if (!summary || summary.length === 0) {
        return "Team members worked on various client activities this week."
      }
      const firstChar = summary.charAt(0).toUpperCase()
      const rest = summary.length > 1 ? summary.slice(1).toLowerCase() : ""
      return `${studentList} focused on ${firstChar}${rest}.`
    } else if (cleanedSummaries.length === 2) {
      const s1 = cleanedSummaries[0] || ""
      const s2 = cleanedSummaries[1] || ""
      return `${studentList} worked on ${s1.toLowerCase()} and ${s2.toLowerCase()}.`
    } else {
      const mainActivities = cleanedSummaries
        .slice(0, 3)
        .filter((s) => s && typeof s === "string") // Extra safety check
        .map((s) => s.toLowerCase())
        .join(", ")
      return `${studentList} completed multiple activities including ${mainActivities}.`
    }
  }

  if (loading) {
    return (
      <Card className="p-6 bg-[#002855] border-none shadow-lg">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">{view === "clinic" ? "Clinic" : "Client"} Performance</h2>
          <p className="text-sm text-white/70">Hours logged by {view}</p>
        </div>
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-[#002855] border-none shadow-lg">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">{view === "clinic" ? "Clinic" : "Client"} Performance</h2>
            <p className="text-sm text-white/70">Hours logged by {view}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("clinic")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === "clinic"
                  ? "bg-[#0096C7] text-white"
                  : "bg-white/10 text-white border border-white/30 hover:bg-white/20"
              }`}
            >
              Clinic
            </button>
            <button
              onClick={() => setView("client")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === "client"
                  ? "bg-[#0096C7] text-white"
                  : "bg-white/10 text-white border border-white/30 hover:bg-white/20"
              }`}
            >
              Client
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#002855" fontSize={12} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
            <YAxis
              stroke="#002855"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              label={{ value: "Hours", angle: -90, position: "insideLeft", style: { fill: "#002855" } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                color: "#002855",
              }}
              formatter={(value: number) => [`${value.toFixed(1)} hours`, "Hours"]}
            />
            <Bar dataKey="hours" radius={[8, 8, 0, 0]} barSize={80}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={view === "clinic" ? getClinicColor(entry.name).hex : "#0096C7"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-gray-200 pt-4">
          {data.map((item) => {
            const colors = view === "clinic" ? getClinicColor(item.name) : { hex: "#0096C7" }
            return (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.hex }}></div>
                  <p className="text-xs font-medium text-gray-900">{item.name}</p>
                </div>
                <p className="text-sm font-bold text-gray-900 ml-5">{item.students} students</p>
                <p className="text-xs text-gray-600 ml-5">{item.hours.toFixed(1)} hours</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-4 bg-white rounded-lg p-6">
        <h3 className="text-lg font-bold text-[#002855] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Weekly Program Summary
        </h3>
        {workEntries.length === 0 ? (
          <p className="text-sm text-gray-600 italic">No activity recorded for this week.</p>
        ) : generatingSummaries ? (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#002855]"></div>
            <span>Generating summaries...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {(() => {
              const byClient = new Map<string, { entries: WorkEntry[]; clinic: string }>()
              workEntries.forEach((entry) => {
                if (!byClient.has(entry.client)) {
                  byClient.set(entry.client, { entries: [], clinic: entry.clinic })
                }
                byClient.get(entry.client)!.entries.push(entry)
              })

              return Array.from(byClient.entries())
                .map(([client, { entries, clinic }]) => {
                  const colors = getClinicColor(clinic === "Resource Acquisition" ? "Funding" : clinic)
                  const students = [...new Set(entries.map((e) => e.student))]
                  const aiSummary = clientSummaries.get(client)

                  if (!aiSummary) return null

                  return (
                    <div key={client} className="border-l-4 pl-5 py-3" style={{ borderColor: colors.hex }}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-[#002855] text-base">{client}</h4>
                        <span
                          className="text-xs font-medium px-2 py-1 rounded-full"
                          style={{ backgroundColor: `${colors.hex}20`, color: colors.hex }}
                        >
                          {clinic}
                        </span>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Team:</span>{" "}
                          {students.map((student, idx) => (
                            <span key={idx}>
                              {student}
                              {idx < students.length - 1 && ", "}
                            </span>
                          ))}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-700 leading-relaxed">{aiSummary}</p>
                      </div>
                    </div>
                  )
                })
                .filter(Boolean)
            })()}
          </div>
        )}
      </div>
    </Card>
  )
}
