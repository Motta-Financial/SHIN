"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Clock, Building, ChevronRight } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ClinicData {
  name: string
  hours: number
  students: number
  clients: number
  weeklyData?: { week: string; hours: number }[]
  color?: string
}

interface ClientData {
  name: string
  hours: number
  students: string[]
  latestSummary: string
  director: string
}

interface WeekSchedule {
  value: string
  label: string
  weekNumber: number
  isBreak: boolean
  weekStart: string
  weekEnd: string
}

interface ClinicPerformanceProps {
  selectedWeeks: string[]
  selectedClinic: string
  weekSchedule?: WeekSchedule[]
}

const CLINIC_COLORS: Record<string, string> = {
  Accounting: "#2d3a4f", // Passionate Blueberry
  "Accounting Clinic": "#2d3a4f",
  Marketing: "#8fa889", // Banyan Serenity
  Consulting: "#565f4b", // Jalapeno Poppers
  "Resource Acquisition": "#5f7082", // Silver Blueberry
  Legal: "#9aacb8", // Tsunami
  SEED: "#3d5a80", // Darker blue variant
}

export function ClinicPerformance({ selectedWeeks, selectedClinic, weekSchedule = [] }: ClinicPerformanceProps) {
  const [debriefs, setDebriefs] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [clinicData, setClinicData] = useState<ClinicData[]>([])
  const [clientData, setClientData] = useState<ClientData[]>([])
  const [expandedClinic, setExpandedClinic] = useState<string | null>(null)
  const [clientToDirectorMap, setClientToDirectorMap] = useState<Map<string, string>>(new Map())

  const directorToClinicMap = new Map<string, string>([
    ["Mark Dwyer", "Accounting"],
    ["Dat Le", "Accounting"],
    ["Nick Vadala", "Consulting"],
    ["Ken Mooney", "Resource Acquisition"],
    ["Christopher Hill", "Marketing"],
    ["Chris Hill", "Marketing"],
    ["Beth DiRusso", "Legal"],
    ["Darrell Mottley", "Legal"],
    ["Boris Lazic", "SEED"],
    ["Grace Cha", "SEED"],
    ["Chaim Letwin", "SEED"],
    ["Dmitri Tcherevik", "SEED"],
  ])

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [debriefsRes, clientsRes] = await Promise.all([
          fetch("/api/supabase/debriefs"),
          fetch("/api/supabase/clients"),
        ])

        if (debriefsRes.ok) {
          const data = await debriefsRes.json()
          setDebriefs(data.debriefs || [])
        }

        if (clientsRes.ok) {
          const data = await clientsRes.json()
          setClients(data.records || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const isDateInWeekRange = (dateStr: string, selectedWeekValues: string[]): boolean => {
    if (selectedWeekValues.length === 0) return true // No filter = all data

    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return false

    return selectedWeekValues.some((weekValue) => {
      const week = weekSchedule.find((w) => w.value === weekValue)
      if (!week) return false

      const weekStart = new Date(week.weekStart)
      const weekEnd = new Date(week.weekEnd)
      // Add 1 day to weekEnd to make it inclusive
      weekEnd.setDate(weekEnd.getDate() + 1)

      return date >= weekStart && date < weekEnd
    })
  }

  // Process data when debriefs/clients/filters change
  useEffect(() => {
    if (loading) return

    console.log("[v0] ClinicPerformance - selectedWeeks:", selectedWeeks)
    console.log("[v0] ClinicPerformance - debriefs count:", debriefs.length)
    if (debriefs.length > 0) {
      console.log("[v0] Sample debrief:", debriefs[0])
      const uniqueClinics = [...new Set(debriefs.map((d: any) => d.clinic))]
      console.log("[v0] Unique clinics in debriefs:", uniqueClinics)
    }

    const clientToClinicMap = new Map<string, string>()

    if (clients.length > 0) {
      clients.forEach((client: any) => {
        const clientName = client.name || client.fields?.["Name"]
        const directorLead = client.primary_director || client.fields?.["Director Lead"]
        if (clientName && directorLead) {
          clientToClinicMap.set(clientName.trim(), directorLead)
        }
      })
    }

    setClientToDirectorMap(clientToClinicMap)

    const filterClinic = selectedClinic === "all" ? "all" : directorToClinicMap.get(selectedClinic) || selectedClinic

    const clinicMap = new Map<string, { hours: number; students: Set<string>; clients: Set<string> }>()
    const clientMap = new Map<
      string,
      { hours: number; students: Set<string>; latestSummary: string; director: string }
    >()

    const uniqueClinicsFromData = new Set<string>()

    debriefs.forEach((debrief: any) => {
      const recordWeek = debrief.weekEnding || debrief.week_ending || ""
      const studentClinic = debrief.clinic || ""
      const clientName = debrief.clientName || debrief.client_name || ""
      const hours = Number.parseFloat(debrief.hoursWorked || debrief.hours_worked || "0")
      const studentName = debrief.studentName || debrief.student_name || ""
      const summary = debrief.workSummary || debrief.work_summary || ""

      const normalizedClinic = studentClinic.replace(" Clinic", "").trim()
      if (normalizedClinic) uniqueClinicsFromData.add(normalizedClinic)

      const matchesClinic =
        filterClinic === "all" || normalizedClinic.includes(filterClinic) || studentClinic.includes(filterClinic)
      const matchesWeek = isDateInWeekRange(recordWeek, selectedWeeks)

      if (matchesWeek && matchesClinic) {
        if (!clinicMap.has(normalizedClinic)) {
          clinicMap.set(normalizedClinic, { hours: 0, students: new Set(), clients: new Set() })
        }

        const data = clinicMap.get(normalizedClinic)!
        data.hours += hours
        if (studentName) data.students.add(studentName)
        if (clientName) data.clients.add(clientName)

        if (clientName) {
          if (!clientMap.has(clientName)) {
            clientMap.set(clientName, {
              hours: 0,
              students: new Set(),
              latestSummary: "",
              director: clientToClinicMap.get(clientName) || "Unknown",
            })
          }
          const cData = clientMap.get(clientName)!
          cData.hours += hours
          if (studentName) cData.students.add(studentName)
          if (summary) cData.latestSummary = summary
        }
      }
    })

    const clinicDataArray: ClinicData[] = Array.from(clinicMap.entries())
      .map(([name, data]) => ({
        name,
        hours: Math.round(data.hours * 10) / 10,
        students: data.students.size,
        clients: data.clients.size,
        color: CLINIC_COLORS[name] || "#000000",
      }))
      .filter((c) => c.hours > 0 || c.students > 0 || c.clients > 0)
      .sort((a, b) => b.hours - a.hours)

    const clientDataArray: ClientData[] = Array.from(clientMap.entries())
      .map(([name, data]) => ({
        name,
        hours: Math.round(data.hours * 10) / 10,
        students: Array.from(data.students),
        latestSummary: data.latestSummary,
        director: data.director,
      }))
      .sort((a, b) => b.hours - a.hours)

    setClinicData(clinicDataArray)
    setClientData(clientDataArray)
  }, [debriefs, clients, loading, selectedWeeks, selectedClinic, weekSchedule])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  const chartData = clinicData.map((clinic) => ({
    name: clinic.name,
    hours: clinic.hours,
    students: clinic.students,
    clients: clinic.clients,
    color: CLINIC_COLORS[clinic.name] || "#000000",
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#002855]">Clinic Performance</h2>
          <p className="text-xs text-muted-foreground">Hours logged by clinic</p>
        </div>
      </div>

      {clinicData.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No data available for selected filters</Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}h`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
                            <p className="font-semibold" style={{ color: data.color }}>
                              {data.name}
                            </p>
                            <p className="text-muted-foreground">{data.hours} hours</p>
                            <p className="text-muted-foreground">{data.students} students</p>
                            <p className="text-muted-foreground">{data.clients} clients</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {clinicData.map((clinic) => {
              const colors = CLINIC_COLORS[clinic.name] || "#000000"
              const relatedClients = clientData.filter((c) => {
                const directorClinic = directorToClinicMap.get(c.director)
                return directorClinic === clinic.name
              })

              return (
                <Dialog key={clinic.name}>
                  <DialogTrigger asChild>
                    <Card
                      className="cursor-pointer transition-all hover:shadow-md border-t-4 group"
                      style={{ borderTopColor: colors }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold truncate" style={{ color: colors }}>
                            {clinic.name}
                          </span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-2xl font-bold">{clinic.hours}h</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {clinic.students}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {clinic.clients}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors }} />
                        {clinic.name} Clinic
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                            <Users className="h-3 w-3" />
                            Students
                          </div>
                          <div className="text-xl font-bold">{clinic.students}</div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                            <Clock className="h-3 w-3" />
                            Hours
                          </div>
                          <div className="text-xl font-bold">{clinic.hours}</div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                            <Building className="h-3 w-3" />
                            Clients
                          </div>
                          <div className="text-xl font-bold">{clinic.clients}</div>
                        </div>
                      </div>

                      {/* Client list */}
                      {relatedClients.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Active Clients</h4>
                          <div className="max-h-60 overflow-y-auto space-y-2">
                            {relatedClients.map((client) => {
                              const clientColors = "#000000" // Placeholder for client colors
                              return (
                                <div
                                  key={client.name}
                                  className="p-3 rounded-lg border"
                                  style={{ borderColor: clientColors + "40" }}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm">{client.name}</span>
                                    <span className="text-xs text-muted-foreground">{client.hours}h</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {client.students.length} student{client.students.length !== 1 ? "s" : ""} assigned
                                  </div>
                                  {client.latestSummary && (
                                    <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">
                                      "{client.latestSummary}"
                                    </p>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
