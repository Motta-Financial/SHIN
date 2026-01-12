"use client"

import { useState, useEffect } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGlobalSemester } from "@/contexts/semester-context"
import { SemesterSelector } from "@/components/semester-selector"
import { Users, Building2, FileText, Clock, GraduationCap, Briefcase, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ArchivedStudent {
  id: string
  fullName: string
  email: string
  clientName?: string
  totalHours: number
  status: string
}

interface ArchivedClient {
  id: string
  name: string
  email?: string
  contact_name?: string
  status: string
}

interface ArchivedDebrief {
  id: string
  student_email: string
  client_name: string
  work_summary: string
  hours_worked: number
  week_ending: string
}

export default function ArchivedPage() {
  const {
    semesters,
    selectedSemester,
    selectedSemesterId,
    activeSemester,
    isLoading: semesterLoading,
  } = useGlobalSemester()

  const [students, setStudents] = useState<ArchivedStudent[]>([])
  const [clients, setClients] = useState<ArchivedClient[]>([])
  const [debriefs, setDebriefs] = useState<ArchivedDebrief[]>([])
  const [loading, setLoading] = useState(false)

  const isViewingArchived = selectedSemester && activeSemester && selectedSemester.id !== activeSemester.id

  // Fetch data when semester changes
  useEffect(() => {
    if (!selectedSemesterId) return

    const fetchArchivedData = async () => {
      setLoading(true)
      try {
        const [studentsRes, clientsRes, debriefsRes] = await Promise.all([
          fetch(`/api/supabase/roster?semesterId=${selectedSemesterId}`),
          fetch(`/api/clients?semesterId=${selectedSemesterId}`),
          fetch(`/api/supabase/debriefs?semesterId=${selectedSemesterId}`),
        ])

        if (studentsRes.ok) {
          const data = await studentsRes.json()
          setStudents(data.students || [])
        }

        if (clientsRes.ok) {
          const data = await clientsRes.json()
          setClients(data.clients || [])
        }

        if (debriefsRes.ok) {
          const data = await debriefsRes.json()
          setDebriefs(data.debriefs || [])
        }
      } catch (error) {
        console.error("Error fetching archived data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchArchivedData()
  }, [selectedSemesterId])

  const totalHours = debriefs.reduce((sum, d) => sum + (d.hours_worked || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>

      <div className="pl-52 pt-14">
        <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
          {/* Header with semester selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-[#3d4559] text-white">Semester Data</Badge>
              <span className="text-sm text-muted-foreground">
                Toggle between semesters to view historical or current data
              </span>
            </div>

            <SemesterSelector />
          </div>

          {isViewingArchived && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="py-3 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Viewing Archived Data</p>
                  <p className="text-sm text-amber-700">
                    You are viewing data from {selectedSemester?.semester}. The entire platform is now filtered to this
                    semester.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Semester Info Banner */}
          {selectedSemester && (
            <Card className="bg-[#3d4559] text-white border-0">
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      {selectedSemester.semester}
                      {selectedSemester.is_active && (
                        <Badge className="bg-[#8fa68f] text-white">Current Semester</Badge>
                      )}
                    </h2>
                    <p className="text-sm text-[#9aacba]">
                      {new Date(selectedSemester.start_date).toLocaleDateString()} -{" "}
                      {new Date(selectedSemester.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{students.length}</p>
                      <p className="text-xs text-[#9aacba]">Students</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{clients.length}</p>
                      <p className="text-xs text-[#9aacba]">Clients</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{debriefs.length}</p>
                      <p className="text-xs text-[#9aacba]">Debriefs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{totalHours.toFixed(0)}</p>
                      <p className="text-xs text-[#9aacba]">Total Hours</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs for different data views */}
          <Tabs defaultValue="students" className="w-full">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="students" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Students
              </TabsTrigger>
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Clients
              </TabsTrigger>
              <TabsTrigger value="debriefs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Debriefs
              </TabsTrigger>
            </TabsList>

            {/* Students Tab */}
            <TabsContent value="students" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#8fa68f]" />
                    Students - {selectedSemester?.semester}
                  </CardTitle>
                  <CardDescription>{students.length} students enrolled in this semester</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : students.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No students found for this semester</p>
                  ) : (
                    <div className="divide-y">
                      {students.map((student) => (
                        <div key={student.id} className="py-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{student.fullName}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            {student.clientName && (
                              <Badge variant="outline" className="bg-[#8fa68f]/10 text-[#4a5240] border-[#8fa68f]">
                                {student.clientName}
                              </Badge>
                            )}
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {student.totalHours}h
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Clients Tab */}
            <TabsContent value="clients" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#8fa68f]" />
                    Clients - {selectedSemester?.semester}
                  </CardTitle>
                  <CardDescription>{clients.length} clients engaged in this semester</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : clients.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No clients found for this semester</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {clients.map((client) => (
                        <Card key={client.id} className="bg-muted/30">
                          <CardContent className="pt-4">
                            <p className="font-medium">{client.name}</p>
                            {client.contact_name && (
                              <p className="text-sm text-muted-foreground">Contact: {client.contact_name}</p>
                            )}
                            {client.email && <p className="text-xs text-muted-foreground mt-1">{client.email}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Debriefs Tab */}
            <TabsContent value="debriefs" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#8fa68f]" />
                    Debriefs - {selectedSemester?.semester}
                  </CardTitle>
                  <CardDescription>
                    {debriefs.length} debriefs submitted this semester ({totalHours.toFixed(1)} total hours)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : debriefs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No debriefs found for this semester</p>
                  ) : (
                    <div className="divide-y max-h-[600px] overflow-y-auto">
                      {debriefs.slice(0, 50).map((debrief) => (
                        <div key={debrief.id} className="py-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm">{debrief.student_email}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {debrief.hours_worked}h<span>•</span>
                              {debrief.week_ending ? new Date(debrief.week_ending).toLocaleDateString() : "N/A"}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs mb-1">
                            {debrief.client_name}
                          </Badge>
                          <p className="text-sm text-muted-foreground line-clamp-2">{debrief.work_summary}</p>
                        </div>
                      ))}
                      {debriefs.length > 50 && (
                        <p className="text-center text-sm text-muted-foreground py-4">
                          Showing 50 of {debriefs.length} debriefs
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
