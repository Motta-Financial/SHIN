"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Briefcase, GraduationCap } from "lucide-react"
import { StakeholderContactCard } from "@/components/stakeholder/stakeholder-contact-card"

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

  return (
    <Card className="p-5 border-slate-200 bg-white">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
        <Users className="h-5 w-5 text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-900">Your Team</h2>
        <Badge variant="outline" className="ml-auto text-xs">
          {teamMembers.length + directors.length} Members
        </Badge>
      </div>

      {/* Directors Section - using StakeholderContactCard */}
      {directors.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            Program Directors
          </h3>
          <div className="space-y-2">
            {directors.map((director) => (
              <StakeholderContactCard
                key={director.id}
                type="director"
                data={
                  {
                    id: director.id,
                    full_name: director.name,
                    email: director.email,
                    clinic: director.clinic,
                    job_title: director.jobTitle,
                    role: director.role,
                    isPrimary: director.isPrimary,
                  } as any
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Student Team Section - using StakeholderContactCard */}
      {teamMembers.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <GraduationCap className="h-3 w-3" />
            Student Consultants
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {teamMembers.map((member) => (
              <StakeholderContactCard
                key={member.id}
                type="student"
                data={{
                  id: member.id,
                  full_name: member.name,
                  email: member.email,
                  clinic: member.clinic,
                  is_team_leader: member.isTeamLeader,
                  linkedin_profile: member.linkedinProfile,
                  academic_level: member.academicLevel,
                  education: member.education,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {teamMembers.length === 0 && directors.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Users className="h-10 w-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No team members assigned yet</p>
        </div>
      )}
    </Card>
  )
}
