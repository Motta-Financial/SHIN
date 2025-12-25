"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Users,
  Building2,
  Clock,
  Mail,
  ChevronDown,
  Briefcase,
  TrendingUp,
  MessageSquare,
  UserCheck,
} from "lucide-react"
import { DiscussionBoard } from "./discussion-board"

interface StudentClinicViewProps {
  currentStudent: {
    id: string
    fullName: string
    email: string
    clinic: string
    clinicId: string
    clientId: string
    clientName: string
  }
}

interface ClinicMember {
  id: string
  name: string
  email: string
  clientId: string
  clientName: string
  role: string
  isTeamLeader: boolean
  hours: number
  debriefs: number
}

export function StudentClinicView({ currentStudent }: StudentClinicViewProps) {
  const [clinicMembers, setClinicMembers] = useState<ClinicMember[]>([])
  const [myTeamMembers, setMyTeamMembers] = useState<ClinicMember[]>([])
  const [debriefs, setDebriefs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("myteam")

  useEffect(() => {
    if (currentStudent.clinicId && currentStudent.clientId) {
      fetchClinicData()
    }
  }, [currentStudent.clinicId, currentStudent.clientId, currentStudent.id])

  const fetchClinicData = async () => {
    setLoading(true)
    try {
      // Fetch members from the student's specific clinic (all team members in the clinic)
      const clinicMappingRes = await fetch(`/api/supabase/v-complete-mapping?clinicId=${currentStudent.clinicId}`)
      const clinicMappingData = await clinicMappingRes.json()

      // Fetch members from the student's specific client team only
      const teamMappingRes = await fetch(`/api/supabase/v-complete-mapping?clientId=${currentStudent.clientId}`)
      const teamMappingData = await teamMappingRes.json()

      // Fetch debriefs filtered by the student's client_id
      const debriefsRes = await fetch(`/api/supabase/debriefs?clientId=${currentStudent.clientId}`)
      const debriefsData = await debriefsRes.json()

      const allDebriefs = debriefsData.debriefs || []
      setDebriefs(allDebriefs)

      // Process all clinic members with their hours
      const processMembers = (mappings: any[]): ClinicMember[] => {
        return (mappings || []).map((m: any) => {
          const memberDebriefs = allDebriefs.filter(
            (d: any) => d.studentId === m.student_id || d.student_id === m.student_id,
          )
          const totalHours = memberDebriefs.reduce(
            (sum: number, d: any) => sum + (Number.parseFloat(d.hoursWorked || d.hours_worked) || 0),
            0,
          )
          return {
            id: m.student_id,
            name: m.student_name,
            email: m.student_email,
            clientId: m.client_id,
            clientName: m.client_name || "Unassigned",
            role: m.student_role || "Team Member",
            isTeamLeader: m.student_role === "Team Leader",
            hours: totalHours,
            debriefs: memberDebriefs.length,
          }
        })
      }

      // Remove duplicates by student_id
      const uniqueById = (members: ClinicMember[]) => {
        const seen = new Set<string>()
        return members.filter((m) => {
          if (seen.has(m.id)) return false
          seen.add(m.id)
          return true
        })
      }

      setClinicMembers(uniqueById(processMembers(clinicMappingData.mappings || clinicMappingData.records || [])))
      setMyTeamMembers(uniqueById(processMembers(teamMappingData.mappings || teamMappingData.records || [])))
    } catch (error) {
      console.error("Error fetching clinic data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Group clinic members by client for the "All Clinic" view
  const membersByClient = useMemo(() => {
    const grouped: Record<string, ClinicMember[]> = {}
    clinicMembers.forEach((member) => {
      if (!grouped[member.clientName]) {
        grouped[member.clientName] = []
      }
      grouped[member.clientName].push(member)
    })
    return grouped
  }, [clinicMembers])

  // Calculate stats for MY team only
  const myTeamStats = useMemo(() => {
    const totalHours = myTeamMembers.reduce((sum, m) => sum + m.hours, 0)
    const totalDebriefs = myTeamMembers.reduce((sum, m) => sum + m.debriefs, 0)
    return { totalHours, totalDebriefs, totalMembers: myTeamMembers.length }
  }, [myTeamMembers])

  // Calculate stats for the full clinic
  const clinicStats = useMemo(() => {
    const totalHours = clinicMembers.reduce((sum, m) => sum + m.hours, 0)
    const totalDebriefs = clinicMembers.reduce((sum, m) => sum + m.debriefs, 0)
    const uniqueClients = Object.keys(membersByClient).length
    return { totalHours, totalDebriefs, uniqueClients, totalMembers: clinicMembers.length }
  }, [clinicMembers, membersByClient])

  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Clinic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-lg" />
              ))}
            </div>
            <div className="h-32 bg-slate-100 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* My Client Team Stats - Primary Focus */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            My Client Team: {currentStudent.clientName}
          </CardTitle>
          <CardDescription>Your assigned client team statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-white border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-600">Team Members</p>
                  <p className="text-xl font-bold text-blue-900">{myTeamStats.totalMembers}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-600">Team Hours</p>
                  <p className="text-xl font-bold text-blue-900">{myTeamStats.totalHours.toFixed(1)}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-600">Team Debriefs</p>
                  <p className="text-xl font-bold text-blue-900">{myTeamStats.totalDebriefs}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="myteam" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            My Team
          </TabsTrigger>
          <TabsTrigger value="clinic" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Full Clinic
          </TabsTrigger>
          <TabsTrigger value="team-discussion" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Team Chat
          </TabsTrigger>
          <TabsTrigger value="clinic-discussion" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Clinic Chat
          </TabsTrigger>
        </TabsList>

        {/* My Client Team Tab */}
        <TabsContent value="myteam" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{currentStudent.clientName} Team</CardTitle>
              <CardDescription>Your client team members and their activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {myTeamMembers.map((member) => (
                  <Collapsible key={member.id}>
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">{member.name}</p>
                            {member.isTeamLeader && (
                              <Badge className="bg-amber-100 text-amber-700 text-xs">Team Leader</Badge>
                            )}
                            {member.id === currentStudent.id && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">You</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">{member.hours.toFixed(1)} hrs</p>
                          <p className="text-xs text-slate-500">{member.debriefs} debriefs</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="h-4 w-4" />
                            <a href={`mailto:${member.email}`} className="text-blue-600 hover:underline">
                              {member.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Briefcase className="h-4 w-4" />
                            <span>{member.clientName}</span>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
                {myTeamMembers.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>No team members found for your client assignment.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Full Clinic Tab */}
        <TabsContent value="clinic" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{currentStudent.clinic} - All Teams</CardTitle>
                  <CardDescription>All students in your clinic organized by client team</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{clinicStats.totalMembers} students</Badge>
                  <Badge variant="outline">{clinicStats.uniqueClients} teams</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(membersByClient).map(([clientName, members]) => (
                <div key={clientName} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div
                    className={`p-3 border-b border-slate-200 ${clientName === currentStudent.clientName ? "bg-blue-50" : "bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-600" />
                      <h3 className="font-medium text-slate-900">{clientName}</h3>
                      {clientName === currentStudent.clientName && (
                        <Badge className="bg-blue-100 text-blue-700 text-xs">Your Team</Badge>
                      )}
                      <Badge variant="outline" className="ml-auto">
                        {members.length} members
                      </Badge>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {members.map((member) => (
                      <div key={member.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-slate-100 text-slate-700 text-sm">
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-900">{member.name}</p>
                              {member.isTeamLeader && (
                                <Badge className="bg-amber-100 text-amber-700 text-xs py-0">Lead</Badge>
                              )}
                              {member.id === currentStudent.id && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs py-0">You</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium text-slate-700">{member.hours.toFixed(1)} hrs</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(membersByClient).length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No clinic data available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Discussion Tab - Filtered to client team only */}
        <TabsContent value="team-discussion" className="mt-4">
          <DiscussionBoard
            contextType="client"
            contextId={currentStudent.clientId}
            currentUser={{
              name: currentStudent.fullName,
              email: currentStudent.email,
              type: "student",
            }}
            title={`${currentStudent.clientName} Team Discussion`}
            description="Collaborate with your client team members"
          />
        </TabsContent>

        {/* Clinic Discussion Tab - Full clinic */}
        <TabsContent value="clinic-discussion" className="mt-4">
          <DiscussionBoard
            contextType="clinic"
            contextId={currentStudent.clinicId}
            currentUser={{
              name: currentStudent.fullName,
              email: currentStudent.email,
              type: "student",
            }}
            title={`${currentStudent.clinic} Discussion`}
            description="Discuss with all students in your clinic"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
