"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import { Building2, Users, Clock, AlertCircle, FileText } from "lucide-react"

interface Client {
  id: string
  name: string
  clinic: string
  students: number
  hoursLogged: number
  hoursTarget: number
  status: "on-track" | "at-risk" | "ahead"
  lastUpdate: string
  recentWork: string[]
}

interface ClientEngagementsProps {
  selectedWeek: string
}

export function ClientEngagements({ selectedWeek }: ClientEngagementsProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const [clientsRes, debriefsRes] = await Promise.all([
          fetch("/api/airtable/clients"),
          fetch("/api/airtable/debriefs"),
        ])

        if (!clientsRes.ok || !debriefsRes.ok) {
          throw new Error("Failed to fetch data from Airtable")
        }

        const clientsData = await clientsRes.json()
        const debriefsData = await debriefsRes.json()

        const clientMap = new Map<string, Client>()

        if (clientsData.records) {
          clientsData.records.forEach((record: any) => {
            const fields = record.fields
            const clientName = fields["Client Name"] || "Unknown Client"
            const primaryClinic = fields["Primary Clinic Director"] || ""

            clientMap.set(record.id, {
              id: record.id,
              name: clientName,
              clinic: primaryClinic,
              students: 0,
              hoursLogged: 0,
              hoursTarget: 60, // Default target
              status: "on-track",
              lastUpdate: "No updates yet",
              recentWork: [],
            })
          })
        }

        if (debriefsData.records) {
          const studentsByClient = new Map<string, Set<string>>()
          const hoursByClient = new Map<string, number>()
          const latestUpdateByClient = new Map<string, Date>()
          const recentWorkByClient = new Map<string, string[]>()

          debriefsData.records.forEach((record: any) => {
            const fields = record.fields
            const weekEnding = fields["END DATE (from WEEK (from SEED | Schedule))"]
            const dateSubmitted = fields["Date Submitted"]

            // Determine the week for this record
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

            // Only include records from the selected week
            if (recordWeek === selectedWeek) {
              const clientLinks = fields["Client"]
              const studentName = fields["Student Name"]
              const hours = Number.parseFloat(fields["Number of Hours Worked"] || "0")
              const workDescription = fields["Summary of Work"]

              if (clientLinks && Array.isArray(clientLinks) && clientLinks.length > 0) {
                clientLinks.forEach((clientId: string) => {
                  if (clientMap.has(clientId)) {
                    if (!studentsByClient.has(clientId)) {
                      studentsByClient.set(clientId, new Set())
                    }
                    if (studentName) {
                      studentsByClient.get(clientId)!.add(studentName)
                    }

                    if (!hoursByClient.has(clientId)) {
                      hoursByClient.set(clientId, 0)
                    }
                    hoursByClient.set(clientId, hoursByClient.get(clientId)! + hours)

                    if (weekEnding) {
                      const dateStr = Array.isArray(weekEnding) ? weekEnding[0] : weekEnding
                      const date = new Date(dateStr)
                      if (!latestUpdateByClient.has(clientId) || date > latestUpdateByClient.get(clientId)!) {
                        latestUpdateByClient.set(clientId, date)
                      }
                    }

                    if (workDescription && workDescription.trim()) {
                      if (!recentWorkByClient.has(clientId)) {
                        recentWorkByClient.set(clientId, [])
                      }
                      const workList = recentWorkByClient.get(clientId)!
                      if (workList.length < 3 && !workList.includes(workDescription)) {
                        workList.push(workDescription)
                      }
                    }
                  }
                })
              }
            }
          })

          clientMap.forEach((client, clientId) => {
            if (studentsByClient.has(clientId)) {
              client.students = studentsByClient.get(clientId)!.size
            }

            if (hoursByClient.has(clientId)) {
              client.hoursLogged = hoursByClient.get(clientId)!
            }

            if (latestUpdateByClient.has(clientId)) {
              client.lastUpdate = "This week"
            }

            if (recentWorkByClient.has(clientId)) {
              client.recentWork = recentWorkByClient.get(clientId)!
            }

            const progress = (client.hoursLogged / client.hoursTarget) * 100
            if (progress >= 100) {
              client.status = "ahead"
            } else if (progress >= 60) {
              client.status = "on-track"
            } else {
              client.status = "at-risk"
            }
          })
        }

        const clientsArray = Array.from(clientMap.values())
        setClients(clientsArray)
      } catch (err) {
        console.error("[v0] Error fetching Airtable data:", err)
        setError("Failed to load client data. Please check your Airtable connection.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedWeek])

  const getStatusColor = (status: Client["status"]) => {
    switch (status) {
      case "ahead":
        return "bg-[#0077B6] text-white"
      case "on-track":
        return "bg-[#0096C7] text-white"
      case "at-risk":
        return "bg-red-500 text-white"
    }
  }

  const getStatusLabel = (status: Client["status"]) => {
    switch (status) {
      case "ahead":
        return "Ahead of Schedule"
      case "on-track":
        return "On Track"
      case "at-risk":
        return "Needs Attention"
    }
  }

  if (loading) {
    return (
      <Card className="p-6 bg-white border-[#002855]/20 shadow-lg">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#002855]">Client Engagements</h2>
          <p className="text-sm text-[#002855]/70">Active client projects and progress</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0077B6] mx-auto mb-4"></div>
            <p className="text-[#002855]/70">Loading client data...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 bg-white border-[#002855]/20 shadow-lg">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#002855]">Client Engagements</h2>
          <p className="text-sm text-[#002855]/70">Active client projects and progress</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (clients.length === 0) {
    return (
      <Card className="p-6 bg-white border-[#002855]/20 shadow-lg">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#002855]">Client Engagements</h2>
          <p className="text-sm text-[#002855]/70">Active client projects and progress</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-[#002855]/70">No client data available</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-white border-[#002855]/20 shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#002855]">Client Engagements</h2>
        <p className="text-sm text-[#002855]/70">Active client projects and progress</p>
      </div>

      <div className="space-y-4">
        {clients.map((client) => {
          const progress = (client.hoursLogged / client.hoursTarget) * 100

          return (
            <div
              key={client.id}
              className="rounded-lg border-2 border-[#002855]/20 bg-gradient-to-r from-white to-[#0096C7]/5 p-4 transition-all hover:border-[#0096C7] hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#0077B6] p-2">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#002855]">{client.name}</h3>
                    <p className="text-sm text-[#002855]/70">{client.clinic} Clinic</p>
                  </div>
                </div>
                <Badge className={getStatusColor(client.status)}>{getStatusLabel(client.status)}</Badge>
              </div>

              <div className="mb-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#002855]/70">Progress</span>
                  <span className="font-medium text-[#002855]">
                    {client.hoursLogged} / {client.hoursTarget} hours
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {client.recentWork.length > 0 && (
                <div className="mb-3 rounded-md bg-[#0096C7]/10 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#0077B6]" />
                    <span className="text-sm font-medium text-[#002855]">Recent Work</span>
                  </div>
                  <ul className="space-y-1">
                    {client.recentWork.map((work, idx) => (
                      <li key={idx} className="text-sm text-[#002855]/80">
                        • {work.length > 80 ? `${work.substring(0, 80)}...` : work}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-[#002855]/70">
                    <Users className="h-4 w-4" />
                    <span>
                      {client.students} student{client.students !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[#002855]/70">
                    <Clock className="h-4 w-4" />
                    <span>{client.lastUpdate}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
