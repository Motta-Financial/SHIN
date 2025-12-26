"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Briefcase, GraduationCap, ChevronDown, ChevronUp, Mail, Linkedin, Building2 } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  clinic: string
  isTeamLeader: boolean
  linkedinProfile?: string
  academicLevel?: string
  education?: string
}

interface Director {
  id: string
  name: string
  email: string
  clinic: string
  jobTitle: string
  role: string
  isPrimary: boolean
}

interface ClientTeamCardProps {
  teamMembers: TeamMember[]
  directors: Director[]
  loading?: boolean
}

export function ClientTeamCard({ teamMembers, directors, loading }: ClientTeamCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedMember, setExpandedMember] = useState<string | null>(null)

  if (loading) {
    return (
      <Card className="p-5 border-slate-200 bg-white">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
          <Users className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Your Team</h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-32" />
                <div className="h-3 bg-slate-200 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  const previewCount = 3
  const allMembers = [...directors, ...teamMembers]
  const previewMembers = allMembers.slice(0, previewCount)
  const remainingCount = allMembers.length - previewCount

  return (
    <Card className="p-5 border-slate-200 bg-white">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
        <Users className="h-5 w-5 text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-900">Your Team</h2>
        <Badge variant="outline" className="ml-auto text-xs">
          {allMembers.length} Members
        </Badge>
      </div>

      {allMembers.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Users className="h-10 w-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No team members assigned yet</p>
        </div>
      ) : (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="space-y-2">
            {/* Preview Members */}
            {previewMembers.map((member) => {
              const isDirector = "jobTitle" in member
              const memberId = member.id
              const isOpen = expandedMember === memberId

              return (
                <div
                  key={memberId}
                  className={`rounded-lg border transition-all ${
                    isDirector ? "bg-blue-50/50 border-blue-200" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div
                    className="p-3 cursor-pointer flex items-center gap-3"
                    onClick={() => setExpandedMember(isOpen ? null : memberId)}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isDirector ? "bg-blue-200 text-blue-700" : "bg-purple-200 text-purple-700"
                      }`}
                    >
                      {isDirector ? <Briefcase className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 truncate">{member.name}</span>
                        {isDirector && (member as Director).isPrimary && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">Primary</Badge>
                        )}
                        {!isDirector && (member as TeamMember).isTeamLeader && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">Team Lead</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {isDirector ? (member as Director).jobTitle : (member as TeamMember).role || "Consultant"}
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>

                  {isOpen && (
                    <div className="px-3 pb-3 pt-0 border-t border-slate-200 mt-2">
                      <div className="pt-3 space-y-2">
                        <a
                          href={`mailto:${member.email}`}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          <Mail className="h-4 w-4" />
                          {member.email}
                        </a>
                        {!isDirector && (member as TeamMember).linkedinProfile && (
                          <a
                            href={(member as TeamMember).linkedinProfile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                          >
                            <Linkedin className="h-4 w-4" />
                            LinkedIn Profile
                          </a>
                        )}
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Building2 className="h-4 w-4" />
                          {member.clinic}
                        </div>
                        {!isDirector && (member as TeamMember).education && (
                          <p className="text-xs text-slate-500">
                            {(member as TeamMember).academicLevel} - {(member as TeamMember).education}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Expandable remaining members */}
            <CollapsibleContent className="space-y-2">
              {allMembers.slice(previewCount).map((member) => {
                const isDirector = "jobTitle" in member
                const memberId = member.id
                const isOpen = expandedMember === memberId

                return (
                  <div
                    key={memberId}
                    className={`rounded-lg border transition-all ${
                      isDirector ? "bg-blue-50/50 border-blue-200" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div
                      className="p-3 cursor-pointer flex items-center gap-3"
                      onClick={() => setExpandedMember(isOpen ? null : memberId)}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isDirector ? "bg-blue-200 text-blue-700" : "bg-purple-200 text-purple-700"
                        }`}
                      >
                        {isDirector ? <Briefcase className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 truncate">{member.name}</span>
                          {isDirector && (member as Director).isPrimary && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs">Primary</Badge>
                          )}
                          {!isDirector && (member as TeamMember).isTeamLeader && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">Team Lead</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {isDirector ? (member as Director).jobTitle : (member as TeamMember).role || "Consultant"}
                        </p>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </div>

                    {isOpen && (
                      <div className="px-3 pb-3 pt-0 border-t border-slate-200 mt-2">
                        <div className="pt-3 space-y-2">
                          <a
                            href={`mailto:${member.email}`}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                          >
                            <Mail className="h-4 w-4" />
                            {member.email}
                          </a>
                          {!isDirector && (member as TeamMember).linkedinProfile && (
                            <a
                              href={(member as TeamMember).linkedinProfile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              <Linkedin className="h-4 w-4" />
                              LinkedIn Profile
                            </a>
                          )}
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Building2 className="h-4 w-4" />
                            {member.clinic}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </CollapsibleContent>
          </div>

          {remainingCount > 0 && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-600">
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show {remainingCount} More Members
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          )}
        </Collapsible>
      )}
    </Card>
  )
}
