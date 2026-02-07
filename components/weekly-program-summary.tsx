"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { getClinicColor } from "@/lib/clinic-colors"
import { getClientColor } from "@/lib/client-colors"

interface WorkEntry {
  student: string
  client: string
  work: string
  hours: number
  clinic: string
  dateSubmitted: string
}

interface WeekScheduleInfo {
  weekStart: string
  weekEnd: string
}

interface WeeklyProgramSummaryProps {
  selectedWeek?: string
  selectedWeeks?: string[]
  selectedClinic: string
  directorId?: string
  weekSchedule?: WeekScheduleInfo[]
}

// Helper functions for sequential fetching with retry
async function fetchWithRetry(url: string, retries = 3, delay = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url)

    // Check if response is "Too Many Requests" by inspecting text
    if (!res.ok && res.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)))
      continue
    }

    // Check for text-based rate limit error
    const contentType = res.headers.get("content-type")
    if (contentType && contentType.includes("text/plain")) {
      const text = await res.clone().text()
      if (text.includes("Too Many R")) {
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)))
          continue
        }
      }
    }

    return res
  }
  return fetch(url)
}

async function fetchSequentially(urls: string[]): Promise<Response[]> {
  // Fetch with small delays between requests to avoid rate limiting
  const results: Response[] = []
  for (const url of urls) {
    if (results.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 150))
    }
    const res = await fetchWithRetry(url)
    results.push(res)
  }
  return results
}

export function WeeklyProgramSummary({
  selectedWeek,
  selectedWeeks = [],
  selectedClinic,
  directorId,
  weekSchedule = [],
}: WeeklyProgramSummaryProps) {
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([])
  const [clientSummaries, setClientSummaries] = useState<Map<string, string>>(new Map())
  const [generatingSummaries, setGeneratingSummaries] = useState(false)
  const [clientToDirectorMap, setClientToDirectorMap] = useState<Map<string, string>>(new Map())
  const [clientTeamMembers, setClientTeamMembers] = useState<Map<string, string[]>>(new Map())

  const normalizedWeeks = selectedWeeks.length > 0 ? selectedWeeks : selectedWeek ? [selectedWeek] : []

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mappingUrl =
          directorId && directorId !== "all"
            ? `/api/supabase/v-complete-mapping?directorId=${directorId}`
            : "/api/supabase/v-complete-mapping"

        const urls = ["/api/supabase/debriefs", "/api/supabase/clients", "/api/directors", mappingUrl]

        const [debriefResponse, clientsResponse, directorsResponse, mappingResponse] = await fetchSequentially(urls)

        // Helper to safely parse JSON response
        const safeParseJson = async (res: Response, name: string) => {
          const contentType = res.headers.get("content-type")
          if (!res.ok) {
            console.log(`[v0] WeeklyProgramSummary - ${name} failed with status: ${res.status}`)
            return null
          }
          if (!contentType || !contentType.includes("application/json")) {
            const text = await res.text()
            console.log(`[v0] WeeklyProgramSummary - ${name} returned non-JSON:`, text.substring(0, 100))
            return null
          }
          try {
            return await res.json()
          } catch (e) {
            console.log(`[v0] WeeklyProgramSummary - ${name} JSON parse error:`, e)
            return null
          }
        }

        const debriefData = await safeParseJson(debriefResponse, "debriefs")
        const clientsData = await safeParseJson(clientsResponse, "clients")
        const directorsData = await safeParseJson(directorsResponse, "directors")
        const mappingData = await safeParseJson(mappingResponse, "mapping")

        // If any critical data failed, exit gracefully
        if (!debriefData || !clientsData || !directorsData || !mappingData) {
          // One or more API responses failed to parse
          setWorkEntries([])
          setGeneratingSummaries(false)
          return
        }

        const mappings = mappingData.data || mappingData.records || mappingData.mappings || []
        const directors = directorsData.directors || []
        const clients = clientsData.records || []

        const directorClientNames = new Set<string>()
        if (directorId && directorId !== "all") {
          mappings.forEach((m: any) => {
            if (m.client_name) {
              directorClientNames.add(m.client_name.trim())
            }
          })
  
        }

        const directorLookup = new Map(directors.map((d: any) => [d.id, d.full_name]))

        const directorMap = new Map<string, string>()
        clients.forEach((client: any) => {
          if (client.name && client.primary_director_id) {
            const directorName = directorLookup.get(client.primary_director_id)
            if (directorName) {
              directorMap.set(client.name.trim(), directorName)
            }
          }
        })

        const teamMap = new Map<string, string[]>()
        const seenStudents = new Map<string, Set<string>>()

        mappings.forEach((m: any) => {
          const clientName = m.client_name?.trim()
          const studentName = m.student_name?.trim()
          if (clientName && studentName) {
            if (!seenStudents.has(clientName)) {
              seenStudents.set(clientName, new Set())
              teamMap.set(clientName, [])
            }
            if (!seenStudents.get(clientName)!.has(studentName)) {
              seenStudents.get(clientName)!.add(studentName)
              teamMap.get(clientName)!.push(studentName)
            }
          }
        })

        setClientToDirectorMap(directorMap)
        setClientTeamMembers(teamMap)

        const allDebriefs = debriefData.debriefs || []
        const filteredRecords = allDebriefs.filter((record: any) => {
          const weekEnding = record.week_ending || record.weekEnding
          const clientName = record.client_name || record.clientName

          if (!weekEnding) return false

          // Range-based week matching: selectedWeeks contains week_start dates
          // We need to check if the debrief's week_ending falls within any selected week's range
          const matchesWeek =
            normalizedWeeks.length === 0 ||
            normalizedWeeks.some((weekStartValue) => {
              // Find the schedule entry for this week to get the actual range
              const scheduleEntry = weekSchedule.find((s) => s.weekStart === weekStartValue)
              if (scheduleEntry) {
                const start = new Date(scheduleEntry.weekStart)
                const end = new Date(scheduleEntry.weekEnd)
                start.setHours(0, 0, 0, 0)
                end.setHours(23, 59, 59, 999)
                const debriefDate = new Date(weekEnding)
                return debriefDate >= start && debriefDate <= end
              }
              // Fallback: if no schedule, assume week is 7 days from start
              const start = new Date(weekStartValue)
              const end = new Date(weekStartValue)
              end.setDate(end.getDate() + 6)
              const debriefDate = new Date(weekEnding)
              return debriefDate >= start && debriefDate <= end
            })

          const matchesDirector =
            !directorId ||
            directorId === "all" ||
            directorClientNames.size === 0 ||
            directorClientNames.has(clientName?.trim())

          return matchesWeek && matchesDirector
        })

        const entries: WorkEntry[] = filteredRecords.map((record: any) => ({
          student: "",
          client: record.client_name || record.clientName || "Unknown",
          work: record.work_summary || record.summary || "",
          hours: record.hours_worked || record.hoursWorked || record.total_hours || 0,
          clinic: record.clinic || "Unknown",
          dateSubmitted: record.week_ending || record.weekEnding || "",
        }))

        setWorkEntries(entries)

        if (entries.length > 0) {
          setGeneratingSummaries(true)
          const uniqueClients = [...new Set(entries.map((e) => e.client))]

          const summaryPromises = uniqueClients.map(async (client) => {
            const clientEntries = entries.filter((e) => e.client === client)
            const response = await fetch("/api/generate-client-summary", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ client, entries: clientEntries }),
            })
            const data = await response.json()
            return { client, summary: data.summary }
          })

          const summaries = await Promise.all(summaryPromises)
          const summaryMap = new Map(summaries.map((s) => [s.client, s.summary]))
          setClientSummaries(summaryMap)
          setGeneratingSummaries(false)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [selectedWeek, selectedWeeks, selectedClinic, directorId, normalizedWeeks, weekSchedule])

  function getWeekEnding(date: Date): string {
    const day = date.getDay()
    const diff = 6 - day
    const weekEnding = new Date(date)
    weekEnding.setDate(date.getDate() + diff)
    return weekEnding.toISOString().split("T")[0]
  }

  return (
    <Card className="p-6">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-primary">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Weekly Program Summary</h3>
              <p className="text-sm text-muted-foreground">Client activity and progress updates</p>
            </div>
          </div>
          {workEntries.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{workEntries.length}</p>
                <p className="text-xs text-muted-foreground">Activities</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {[...new Set(workEntries.map((e) => e.client))].length}
                </p>
                <p className="text-xs text-muted-foreground">Clients</p>
              </div>
            </div>
          )}
        </div>

        {workEntries.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 00-.707.293h-3.172a1 1 0 00-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <p className="text-muted-foreground font-medium">No activity recorded for this week</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later for updates</p>
          </div>
        ) : generatingSummaries ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
            <p className="text-foreground font-medium">Generating AI summaries...</p>
            <p className="text-sm text-muted-foreground mt-1">This may take a moment</p>
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
                .map(([client, { entries, clinic }]) => {
                  const colors = getClinicColor(clinic === "Resource Acquisition" ? "Funding" : clinic)
                  const clientColors = getClientColor(client)
                  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)
                  const aiSummary = clientSummaries.get(client)

                  const trimmedClient = client.trim()
                  const actualDirector = clientToDirectorMap.get(trimmedClient)
                  const displayDirector = actualDirector || "Director TBD"

                  const fullTeamList = clientTeamMembers.get(trimmedClient) || []
                  const totalTeamSize = fullTeamList.length

                  if (!aiSummary) return null

                  return (
                    <div
                      key={client}
                      className="bg-card rounded-xl shadow-sm border-2 hover:shadow-md transition-all duration-200"
                      style={{ borderColor: clientColors.hex }}
                    >
                      <div className="p-5 border-b border-border" style={{ backgroundColor: `${clientColors.hex}08` }}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm"
                              style={{ backgroundColor: clientColors.hex }}
                            >
                              {client.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-foreground text-lg">{client}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary shadow-sm">
                                  <svg
                                    className="w-4 h-4 text-primary-foreground"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                  </svg>
                                  <span className="text-sm font-bold text-primary-foreground">{displayDirector}</span>
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
                              <p className="text-xs text-muted-foreground">Team Size</p>
                              <p className="text-sm font-bold text-foreground">{totalTeamSize} students</p>
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
                              <p className="text-xs text-muted-foreground">Hours Logged</p>
                              <p className="text-sm font-bold text-foreground">{totalHours.toFixed(1)} hrs</p>
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
                              <p className="text-xs text-muted-foreground">Activities</p>
                              <p className="text-sm font-bold text-foreground">{entries.length}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-5 py-3 bg-muted/50 border-b border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Team Members
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {fullTeamList.length > 0 ? (
                            fullTeamList.map((studentName, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-card border border-border text-foreground shadow-sm"
                              >
                                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                {studentName}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No team members assigned</span>
                          )}
                        </div>
                        {fullTeamList.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <span>
                              {fullTeamList.length} team member{fullTeamList.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <h5 className="text-sm font-bold text-foreground uppercase tracking-wide">Weekly Summary</h5>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                          <p className="text-sm text-foreground leading-relaxed">{aiSummary}</p>
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
