"use client"

import { useState, useEffect, useMemo } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Calendar, Clock, ChevronDown, ChevronUp, Building2 } from "lucide-react"
import { useUserRole } from "@/hooks/use-user-role"
import { StudentPortalHeader } from "@/components/student-portal-header"

interface Debrief {
  id: string
  studentId: string
  studentEmail: string
  clientName: string
  clinic: string
  hoursWorked: string | number
  workSummary: string
  questions: string | null
  weekEnding: string
  createdAt: string
  status: string
  weekNumber: number
}

const SPRING_2026_SEMESTER_ID = "a1b2c3d4-e5f6-7890-abcd-202601120000"

export default function StudentDebriefsPage() {
  const [debriefs, setDebriefs] = useState<Debrief[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDebrief, setExpandedDebrief] = useState<string | null>(null)
  const [studentInfo, setStudentInfo] = useState<{
    fullName: string
    email: string
    clinic: string
    clientName?: string
    isTeamLeader: boolean
  } | null>(null)

  const { studentId: authStudentId, isLoading: userLoading, isAuthenticated, role } = useUserRole()

  // Fetch student info using the authenticated student's ID
  useEffect(() => {
    async function fetchStudentInfo() {
      if (!authStudentId) return

      try {
        const url = `/api/supabase/v-complete-mapping?studentId=${authStudentId}`
        const response = await fetch(url)
        const data = await response.json()

        if (data.success && data.data?.length > 0) {
          const student = data.data[0]
          setStudentInfo({
            fullName: student.student_name || "Student",
            email: student.student_email || "",
            clinic: student.student_clinic_name || "Unknown Clinic",
            clientName: student.client_name,
            isTeamLeader: student.student_role === "Team Leader",
          })
        }
      } catch (error) {
        console.error("Error fetching student info:", error)
      }
    }

    if (!userLoading && authStudentId) {
      fetchStudentInfo()
    }
  }, [authStudentId, userLoading])

  // Fetch debriefs for the current student using their ID
  useEffect(() => {
    async function fetchDebriefs() {
      if (!authStudentId) return

      try {
        const response = await fetch(
          `/api/supabase/debriefs?semesterId=${SPRING_2026_SEMESTER_ID}&studentId=${authStudentId}`,
        )
        const data = await response.json()
        if (data.debriefs) {
          setDebriefs(data.debriefs)
        }
      } catch (error) {
        console.error("Error fetching debriefs:", error)
      } finally {
        setLoading(false)
      }
    }

    if (!userLoading && authStudentId) {
      fetchDebriefs()
    }
  }, [authStudentId, userLoading])

  // Group debriefs by week
  const debriefsbyWeek = useMemo(() => {
    const grouped: Record<number, Debrief[]> = {}
    debriefs.forEach((d) => {
      if (!grouped[d.weekNumber]) {
        grouped[d.weekNumber] = []
      }
      grouped[d.weekNumber].push(d)
    })
    return grouped
  }, [debriefs])

  const totalHours = debriefs.reduce((sum, d) => sum + Number.parseFloat(String(d.hoursWorked) || "0"), 0)

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "submitted":
        return <Badge className="bg-green-100 text-green-700">Submitted</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
      case "reviewed":
        return <Badge className="bg-blue-100 text-blue-700">Reviewed</Badge>
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>

      <div className="pl-52 pt-14">
        <main className="p-6 space-y-6">
          <StudentPortalHeader
            loading={userLoading || loading}
            currentStudent={studentInfo}
            totalHours={totalHours}
            totalAttendance={debriefs.length}
          />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Debriefs</h1>
              <p className="text-sm text-slate-500">View your submitted weekly debriefs and work summaries</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">{totalHours.toFixed(1)} total hours logged</span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : debriefs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700">No Debriefs Yet</h3>
                <p className="text-sm text-slate-500 mt-1">Your submitted debriefs will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(debriefsbyWeek)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([weekNum, weekDebriefs]) => (
                  <Card key={weekNum} className="overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-slate-600" />
                          Week {weekNum}
                        </CardTitle>
                        <Badge variant="outline">
                          {weekDebriefs.length} debrief{weekDebriefs.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {weekDebriefs.map((debrief) => (
                        <div
                          key={debrief.id}
                          className="border-b last:border-b-0 hover:bg-slate-50/50 transition-colors"
                        >
                          <button
                            className="w-full p-4 text-left"
                            onClick={() => setExpandedDebrief(expandedDebrief === debrief.id ? null : debrief.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{debrief.clientName}</p>
                                  <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span>{debrief.hoursWorked} hours</span>
                                    <span>•</span>
                                    <span>{new Date(debrief.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {getStatusBadge(debrief.status)}
                                {expandedDebrief === debrief.id ? (
                                  <ChevronUp className="h-5 w-5 text-slate-400" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-slate-400" />
                                )}
                              </div>
                            </div>
                          </button>

                          {expandedDebrief === debrief.id && (
                            <div className="px-4 pb-4 space-y-4 border-t bg-slate-50/50">
                              <div className="pt-4">
                                <h4 className="text-sm font-medium text-slate-700 mb-2">Work Summary</h4>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                  {debrief.workSummary || "No summary provided."}
                                </p>
                              </div>

                              {debrief.questions && (
                                <div>
                                  <h4 className="text-sm font-medium text-slate-700 mb-2">Questions/Notes</h4>
                                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{debrief.questions}</p>
                                </div>
                              )}

                              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t">
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {debrief.clinic}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Week ending: {debrief.weekEnding}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
