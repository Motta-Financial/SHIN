"use client"

import { Card } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { getClinicColor } from "@/lib/clinic-colors"
import { generateWeeklySummary } from "@/app/actions/generate-summary"

interface PerformanceData {
  name: string
  hours: number
  students: number
  clients: number
}

interface ClinicPerformanceProps {
  selectedWeek: string
}

export function ClinicPerformance({ selectedWeek }: ClinicPerformanceProps) {
  const [data, setData] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"clinic" | "client">("clinic")
  const [weeklySummary, setWeeklySummary] = useState<string>("")
  const [summaryLoading, setSummaryLoading] = useState(false)

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

        const workSummaries: string[] = []

        if (view === "clinic") {
          const clinicMap = new Map<string, PerformanceData>()
          const clinicNames = ["Consulting", "Accounting", "Resource Acquisition", "Marketing"]

          clinicNames.forEach((name) => {
            clinicMap.set(name, {
              name: name === "Resource Acquisition" ? "Funding" : name,
              hours: 0,
              students: 0,
              clients: 0,
            })
          })

          if (clientsData.records) {
            clientsData.records.forEach((record: any) => {
              const fields = record.fields
              const primaryClinic = fields["Primary Clinic Director"] || ""

              clinicNames.forEach((clinicName) => {
                if (primaryClinic.includes(clinicName)) {
                  const clinic = clinicMap.get(clinicName)
                  if (clinic) {
                    clinic.clients++
                  }
                }
              })
            })
          }

          const studentsByClinic = new Map<string, Set<string>>()

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
                const clinicField = fields["Related Clinic"]
                const studentName = fields["Student Name"]
                const hours = Number.parseFloat(fields["Number of Hours Worked"] || "0")
                const workSummary = fields["Summary of Work"]
                if (workSummary) {
                  workSummaries.push(`${studentName || "Student"} (${clinicField || "Unknown Clinic"}): ${workSummary}`)
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

          setData(Array.from(clinicMap.values()))
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
                const clientName = fields["Client"] || "No Client"
                const studentName = fields["Student Name"]
                const hours = Number.parseFloat(fields["Number of Hours Worked"] || "0")
                const workSummary = fields["Summary of Work"]
                if (workSummary) {
                  workSummaries.push(`${studentName || "Student"} (${clientName}): ${workSummary}`)
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

        if (workSummaries.length > 0) {
          setSummaryLoading(true)
          try {
            const summary = await generateWeeklySummary(workSummaries)
            setWeeklySummary(summary)
          } catch (error) {
            console.error("[v0] Error generating summary:", error)
            setWeeklySummary("Unable to generate weekly summary at this time.")
          } finally {
            setSummaryLoading(false)
          }
        } else {
          setWeeklySummary("No activity recorded for this week.")
        }
      } catch (error) {
        console.error("[v0] Error fetching clinic performance:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchClinicData()
  }, [selectedWeek, view])

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

      <div className="mt-4 bg-white rounded-lg p-4">
        <h3 className="text-lg font-bold text-[#002855] mb-3 flex items-center gap-2">
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
        {summaryLoading ? (
          <div className="flex items-center gap-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0096C7]"></div>
            <span className="text-sm">Generating summary...</span>
          </div>
        ) : (
          <div className="text-sm text-gray-700 leading-relaxed space-y-3">
            {weeklySummary.split("\n\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
