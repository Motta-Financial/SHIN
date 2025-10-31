"use client"

import { Card } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { getClinicColor } from "@/lib/clinic-colors"
import { getClientColor } from "@/lib/client-colors"

const CLIENT_ORDER = [
  "Serene Cycle",
  "Intriguing Hair",
  "The Downtown Paw",
  "REWRITE",
  "Marabou Café",
  "SEED",
  "Crown Legends",
  "Sawyer Parks",
  "City of Malden",
  "Future Masters of Chess Academy",
  "Muffy White",
]

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
  selectedClinic: string // Added selectedClinic prop
}

export function ClinicPerformance({ selectedWeek, selectedClinic }: ClinicPerformanceProps) {
  const [data, setData] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"clinic" | "client">("clinic")
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([])
  const [clientSummaries, setClientSummaries] = useState<Map<string, string>>(new Map())
  const [clientToDirectorMap, setClientToDirectorMap] = useState<Map<string, string>>(new Map())
  const [clientTeamMembers, setClientTeamMembers] = useState<Map<string, string[]>>(new Map())
  const [generatingSummaries, setGeneratingSummaries] = useState(false) // Declared generatingSummaries

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

        const clientToClinicMap = new Map<string, string>()
        const directorToClientsMap = new Map<string, Set<string>>()
        const teamMembersMap = new Map<string, string[]>()

        if (clientsData.records) {
          clientsData.records.forEach((record: any) => {
            const fields = record.fields
            const clientName = fields["Client Name"]?.trim()
            const primaryDirector = fields["Primary Clinic Director"]
            if (clientName && primaryDirector) {
              clientToClinicMap.set(clientName, primaryDirector)

              if (!directorToClientsMap.has(primaryDirector)) {
                directorToClientsMap.set(primaryDirector, new Set())
              }
              directorToClientsMap.get(primaryDirector)!.add(clientName)

              const teamMembers: string[] = []

              if (fields["Consulting (Team Leader)"]) {
                const leaders = fields["Consulting (Team Leader)"].split(",").map((n: string) => n.trim())
                teamMembers.push(...leaders.filter((n: string) => n))
              }

              if (fields["Accounting"]) {
                const accountants = fields["Accounting"].split(",").map((n: string) => n.trim())
                teamMembers.push(...accountants.filter((n: string) => n))
              }

              if (fields["Resource Acquisition"]) {
                const resourceTeam = fields["Resource Acquisition"].split(",").map((n: string) => n.trim())
                teamMembers.push(...resourceTeam.filter((n: string) => n))
              }

              if (fields["Marketing"]) {
                const marketers = fields["Marketing"].split(",").map((n: string) => n.trim())
                teamMembers.push(...marketers.filter((n: string) => n))
              }

              teamMembersMap.set(clientName, teamMembers)
            }
          })
        }

        setClientToDirectorMap(clientToClinicMap)
        setClientTeamMembers(teamMembersMap)

        console.log("[v0] Clinic Performance - Total debrief records:", debriefsData.records?.length || 0)
        console.log("[v0] Clinic Performance - Selected week:", selectedWeek)
        console.log("[v0] Clinic Performance - Selected clinic:", selectedClinic)

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

          const selectedClinicName = selectedClinic !== "all" ? directorToClinicMap.get(selectedClinic) : null

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

              const roleField = fields["ROLE (from SEED | Students)"]
              const studentRole = Array.isArray(roleField) ? roleField[0] : roleField
              const studentClinic =
                roleToClinicMap.get(studentRole?.toUpperCase()) || fields["Related Clinic"] || "Unknown"

              const clientField = fields["Client"]
              const clientName = Array.isArray(clientField) ? clientField[0] : clientField
              const trimmedClientName = clientName?.trim()

              const matchesClinic =
                selectedClinic === "all" || (selectedClinicName && studentClinic === selectedClinicName)

              if (recordWeek === selectedWeek && matchesClinic) {
                const studentNameField = fields["NAME (from SEED | Students)"]
                const studentName = Array.isArray(studentNameField) ? studentNameField[0] : studentNameField
                const hours = Number.parseFloat(fields["Number of Hours Worked"] || "0")
                const workSummary = fields["Summary of Work"]

                if (workSummary && studentName) {
                  entries.push({
                    student: studentName,
                    clinic: studentClinic,
                    client: trimmedClientName || "No Client",
                    summary: workSummary,
                    hours: hours,
                  })
                }

                if (clinicMap.has(studentClinic)) {
                  const clinic = clinicMap.get(studentClinic)
                  if (clinic) {
                    clinic.hours += hours

                    if (!studentsByClinic.has(studentClinic)) {
                      studentsByClinic.set(studentClinic, new Set())
                    }
                    if (studentName) {
                      studentsByClinic.get(studentClinic)!.add(studentName)
                    }

                    if (!clientsByClinic.has(studentClinic)) {
                      clientsByClinic.set(studentClinic, new Set())
                    }
                    if (trimmedClientName && trimmedClientName !== "No Client") {
                      clientsByClinic.get(studentClinic)!.add(trimmedClientName)
                    }
                  }
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

          const finalData = Array.from(clinicMap.values()).filter(
            (clinic) => selectedClinic === "all" || clinic.hours > 0,
          )
          console.log("[v0] Clinic Performance - Final data:", finalData)
          setData(finalData)
        } else {
          const clientMap = new Map<string, PerformanceData>()
          const directorClients = selectedClinic !== "all" ? directorToClientsMap.get(selectedClinic) : null

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

              const roleField = fields["ROLE (from SEED | Students)"]
              const studentRole = Array.isArray(roleField) ? roleField[0] : roleField
              const studentClinic =
                roleToClinicMap.get(studentRole?.toUpperCase()) || fields["Related Clinic"] || "Unknown"

              const clientField = fields["Client"]
              const clientName = Array.isArray(clientField) ? clientField[0] : clientField
              const trimmedClientName = clientName?.trim()

              const matchesClinic =
                selectedClinic === "all" ||
                (directorClients && trimmedClientName && directorClients.has(trimmedClientName))

              if (recordWeek === selectedWeek && matchesClinic) {
                const studentNameField = fields["NAME (from SEED | Students)"]
                const studentName = Array.isArray(studentNameField) ? studentNameField[0] : studentNameField
                const hours = Number.parseFloat(fields["Number of Hours Worked"] || "0")
                const workSummary = fields["Summary of Work"]

                if (workSummary && studentName) {
                  entries.push({
                    student: studentName,
                    clinic: studentClinic,
                    client: trimmedClientName || "No Client",
                    summary: workSummary,
                    hours: hours,
                  })
                }

                if (!clientMap.has(trimmedClientName || "No Client")) {
                  clientMap.set(trimmedClientName || "No Client", {
                    name: trimmedClientName || "No Client",
                    hours: 0,
                    students: 0,
                    clients: 1,
                  })
                }

                const client = clientMap.get(trimmedClientName || "No Client")!
                client.hours += hours

                if (studentName) {
                  const studentSet = new Set<string>()
                  clientMap.forEach((c) => {
                    if (c.name === (trimmedClientName || "No Client")) {
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
  }, [selectedWeek, view, selectedClinic])

  useEffect(() => {
    async function generateSummaries() {
      if (workEntries.length === 0) return

      setGeneratingSummaries(true)
      const summariesMap = new Map<string, string>()

      try {
        const response = await fetch(`/api/weekly-summaries?week_ending=${selectedWeek}`)
        if (response.ok) {
          const { summaries: cachedSummaries } = await response.json()
          console.log("[v0] Loaded cached summaries:", Object.keys(cachedSummaries).length)

          // Use cached summaries
          Object.entries(cachedSummaries).forEach(([clientName, data]: [string, any]) => {
            summariesMap.set(clientName, data.summary)
          })
        }
      } catch (error) {
        console.error("[v0] Error fetching cached summaries:", error)
      }

      const byClient = new Map<string, { entries: WorkEntry[]; clinic: string }>()
      workEntries.forEach((entry) => {
        if (!byClient.has(entry.client)) {
          byClient.set(entry.client, { entries: [], clinic: entry.clinic })
        }
        byClient.get(entry.client)!.entries.push(entry)
      })

      for (const [client, data] of byClient.entries()) {
        // Skip if we already have a cached summary
        if (summariesMap.has(client)) {
          console.log("[v0] Using cached summary for:", client)
          continue
        }

        const { entries, clinic } = data
        const students = [...new Set(entries.map((e) => e.student).filter((s) => s && typeof s === "string"))]
        const workSummaries = entries
          .map((e) => e.summary)
          .filter((s) => s && typeof s === "string" && s.trim().length > 10)

        if (workSummaries.length > 0 && students.length > 0) {
          try {
            console.log("[v0] Generating NEW summary for:", client)
            const { generateClientSummary } = await import("@/app/actions/generate-client-summary")
            const aiSummary = await generateClientSummary(client, workSummaries, students)
            summariesMap.set(client, aiSummary)

            const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)
            await fetch("/api/weekly-summaries", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                client_name: client,
                week_ending: selectedWeek,
                clinic: clinic,
                summary: aiSummary,
                student_count: students.length,
                total_hours: totalHours,
                activity_count: entries.length,
              }),
            })
            console.log("[v0] Cached summary for:", client)
          } catch (error) {
            console.error(`[v0] AI generation failed for ${client}, using fallback:`, error)
            const fallbackSummary = createFallbackSummary(workSummaries, students)
            summariesMap.set(client, fallbackSummary)
          }
        }
      }

      setClientSummaries(summariesMap)
      setGeneratingSummaries(false)
    }

    generateSummaries()
  }, [workEntries, selectedWeek])

  const createFallbackSummary = (workSummaries: string[], students: string[]): string => {
    const cleanedSummaries = workSummaries
      .filter((s) => s && typeof s === "string")
      .map((s) => {
        return s
          .replace(/\b\d+(\.\d+)?\s*(hours?|hrs?)\b/gi, "")
          .replace(/^\d+(\.\d+)?$/, "")
          .replace(/\s+/g, " ")
          .trim()
      })
      .filter((s) => s && s.length > 10)
      .filter((s, idx, arr) => arr.indexOf(s) === idx)

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
        .filter((s) => s && typeof s === "string")
        .map((s) => s.toLowerCase())
        .join(", ")
      return `${studentList} completed multiple activities including ${mainActivities}.`
    }
  }

  if (loading) {
    return (
      <Card className="p-6 bg-[#002855] border-none shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">{view === "clinic" ? "Clinic" : "Client"} Performance</h2>
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
            <h2 className="text-2xl font-bold text-white">{view === "clinic" ? "Clinic" : "Client"} Performance</h2>
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
                <Cell
                  key={`cell-${index}`}
                  fill={view === "clinic" ? getClinicColor(entry.name).hex : getClientColor(entry.name).hex}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-gray-200 pt-4">
          {data.map((item) => {
            const colors = view === "clinic" ? getClinicColor(item.name) : getClientColor(item.name)
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

      <div className="mt-6 bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-[#0096C7]">
          <div className="flex items-center gap-3">
            <div className="bg-[#0096C7] p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#002855]">Weekly Program Summary</h3>
              <p className="text-sm text-gray-600">Client activity and progress updates</p>
            </div>
          </div>
          {workEntries.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-[#0096C7]">{workEntries.length}</p>
                <p className="text-xs text-gray-600">Activities</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#0096C7]">
                  {[...new Set(workEntries.map((e) => e.client))].length}
                </p>
                <p className="text-xs text-gray-600">Clients</p>
              </div>
            </div>
          )}
        </div>

        {workEntries.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 00-.707.293h-3.172a1 1 0 00-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No activity recorded for this week</p>
            <p className="text-sm text-gray-500 mt-1">Check back later for updates</p>
          </div>
        ) : generatingSummaries ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0096C7] border-t-transparent mb-4"></div>
            <p className="text-gray-700 font-medium">Generating AI summaries...</p>
            <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const byClient = new Map<string, { entries: WorkEntry[]; clinic: string }>()
              workEntries.forEach((entry) => {
                if (!byClient.has(entry.client)) {
                  byClient.set(entry.client, { entries: [], clinic: entry.clinic })
                }
                byClient.get(entry.client)!.entries.push(entry)
              })

              return Array.from(byClient.entries())
                .sort(([clientA], [clientB]) => {
                  const indexA = CLIENT_ORDER.indexOf(clientA)
                  const indexB = CLIENT_ORDER.indexOf(clientB)

                  // If both clients are in the order list, sort by their position
                  if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB
                  }
                  // If only clientA is in the list, it comes first
                  if (indexA !== -1) return -1
                  // If only clientB is in the list, it comes first
                  if (indexB !== -1) return 1
                  // If neither is in the list, sort alphabetically
                  return clientA.localeCompare(clientB)
                })
                .map(([client, { entries, clinic }]) => {
                  const colors = getClinicColor(clinic === "Resource Acquisition" ? "Funding" : clinic)
                  const clientColors = getClientColor(client)
                  const students = [...new Set(entries.map((e) => e.student))]
                  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)
                  const aiSummary = clientSummaries.get(client)

                  const trimmedClient = client.trim()
                  const actualDirector = clientToDirectorMap.get(trimmedClient)
                  const displayDirector = actualDirector || "Director TBD"

                  const fullTeamList = clientTeamMembers.get(trimmedClient) || []
                  const activeStudents = new Set(students)
                  const inactiveStudents = fullTeamList.filter((member) => !activeStudents.has(member))

                  if (!aiSummary) return null

                  return (
                    <div
                      key={client}
                      className="bg-white rounded-xl shadow-sm border-2 hover:shadow-md transition-all duration-200"
                      style={{ borderColor: clientColors.hex }}
                    >
                      <div
                        className="p-5 border-b border-gray-100"
                        style={{ backgroundColor: `${clientColors.hex}08` }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm"
                              style={{ backgroundColor: clientColors.hex }}
                            >
                              {client.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-[#002855] text-lg">{client}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-[#0096C7] to-[#0077B6] shadow-sm">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span className="text-sm font-bold text-white">{displayDirector}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <span
                            className="px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
                            style={{ backgroundColor: colors.hex, color: "white" }}
                          >
                            {clinic}
                          </span>
                        </div>

                        <div className="flex items-center gap-6 mt-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Team Size</p>
                              <p className="text-sm font-bold text-gray-900">{students.length} students</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Hours Logged</p>
                              <p className="text-sm font-bold text-gray-900">{totalHours.toFixed(1)} hrs</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-purple-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Activities</p>
                              <p className="text-sm font-bold text-gray-900">{entries.length}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Team Members</p>
                        <div className="flex flex-wrap gap-2">
                          {students.map((student, idx) => (
                            <span
                              key={`active-${idx}`}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-700 shadow-sm"
                            >
                              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                              {student}
                            </span>
                          ))}
                          {inactiveStudents.map((student, idx) => (
                            <span
                              key={`inactive-${idx}`}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-500 shadow-sm opacity-75"
                            >
                              <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                              {student}
                            </span>
                          ))}
                        </div>
                        {fullTeamList.length > 0 && (
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              <span>Active ({students.length})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              <span>Inactive ({inactiveStudents.length})</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-5 h-5 text-[#0096C7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <h5 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Weekly Summary</h5>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                          <p className="text-sm text-gray-800 leading-relaxed">{aiSummary}</p>
                        </div>
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
