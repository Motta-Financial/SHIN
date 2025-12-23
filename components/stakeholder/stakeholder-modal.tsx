"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Mail,
  Linkedin,
  ExternalLink,
  Building2,
  GraduationCap,
  Briefcase,
  Globe,
  Users,
  Crown,
  Calendar,
  BookOpen,
} from "lucide-react"

export type StakeholderType = "director" | "student" | "client"

export interface DirectorData {
  id: string
  full_name: string
  email: string
  clinic: string
  job_title?: string
  role?: string
  semester?: string
  clients?: { id: string; name: string; isPrimary: boolean }[]
}

export interface StudentData {
  id: string
  full_name: string
  first_name?: string
  last_name?: string
  email: string
  clinic: string
  client_team?: string
  is_team_leader?: boolean
  academic_level?: string
  education?: string
  linkedin_profile?: string
  business_experience?: string
  semester?: string
  status?: string
  clients?: { id: string; name: string }[]
  directors?: { id: string; name: string }[]
}

export interface ClientData {
  id: string
  name: string
  email?: string
  contact_name?: string
  website?: string
  project_type?: string
  status?: string
  semester?: string
  alumni_mentor?: string
  team_members?: { id: string; name: string; clinic: string; isTeamLeader: boolean }[]
  directors?: { id: string; name: string; isPrimary: boolean }[]
}

interface StakeholderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: StakeholderType
  data: DirectorData | StudentData | ClientData | null
  loading?: boolean
}

export function StakeholderModal({ open, onOpenChange, type, data, loading }: StakeholderModalProps) {
  if (!data && !loading) return null

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getClinicColor = (clinic: string) => {
    const colors: Record<string, string> = {
      "Consulting Clinic": "bg-blue-100 text-blue-700 border-blue-300",
      Consulting: "bg-blue-100 text-blue-700 border-blue-300",
      "Marketing Clinic": "bg-purple-100 text-purple-700 border-purple-300",
      Marketing: "bg-purple-100 text-purple-700 border-purple-300",
      "Accounting Clinic": "bg-green-100 text-green-700 border-green-300",
      Accounting: "bg-green-100 text-green-700 border-green-300",
      "Resource Acquisition Clinic": "bg-amber-100 text-amber-700 border-amber-300",
      "Resource Acquisition": "bg-amber-100 text-amber-700 border-amber-300",
    }
    return colors[clinic] || "bg-slate-100 text-slate-700 border-slate-300"
  }

  const getTypeIcon = () => {
    switch (type) {
      case "director":
        return <Briefcase className="h-5 w-5 text-slate-600" />
      case "student":
        return <GraduationCap className="h-5 w-5 text-blue-600" />
      case "client":
        return <Building2 className="h-5 w-5 text-purple-600" />
    }
  }

  const getTypeBgColor = () => {
    switch (type) {
      case "director":
        return "bg-slate-700"
      case "student":
        return "bg-blue-600"
      case "client":
        return "bg-purple-600"
    }
  }

  const renderDirectorContent = (director: DirectorData) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar className={`h-16 w-16 ${getTypeBgColor()}`}>
          <AvatarFallback className={`${getTypeBgColor()} text-white text-xl`}>
            {getInitials(director.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">{director.full_name}</h2>
          {director.job_title && <p className="text-sm text-slate-600">{director.job_title}</p>}
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getClinicColor(director.clinic)}>{director.clinic}</Badge>
            {director.role && (
              <Badge variant="outline" className="text-xs">
                {director.role}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Contact Info */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Contact Information
        </h3>
        <div className="grid gap-2">
          <a
            href={`mailto:${director.email}`}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <Mail className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-blue-600 hover:underline">{director.email}</span>
          </a>
        </div>
      </div>

      {/* Assigned Clients */}
      {director.clients && director.clients.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Assigned Clients
          </h3>
          <div className="grid gap-2">
            {director.clients.map((client) => (
              <div key={client.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <Building2 className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">{client.name}</span>
                {client.isPrimary && (
                  <Badge className="ml-auto bg-amber-100 text-amber-700 text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Primary
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {director.semester && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="h-4 w-4" />
          <span>{director.semester}</span>
        </div>
      )}
    </div>
  )

  const renderStudentContent = (student: StudentData) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar className={`h-16 w-16 ${getTypeBgColor()}`}>
          <AvatarFallback className={`${getTypeBgColor()} text-white text-xl`}>
            {getInitials(student.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">{student.full_name}</h2>
            {student.is_team_leader && (
              <Badge className="bg-blue-500 text-white">
                <Crown className="h-3 w-3 mr-1" />
                Team Lead
              </Badge>
            )}
          </div>
          {student.academic_level && <p className="text-sm text-slate-600">{student.academic_level}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge className={getClinicColor(student.clinic)}>{student.clinic}</Badge>
            {student.client_team && (
              <Badge variant="outline" className="text-xs">
                {student.client_team}
              </Badge>
            )}
            {student.status && (
              <Badge variant="outline" className={student.status === "active" ? "text-green-600 border-green-300" : ""}>
                {student.status}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Contact Info */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Contact Information
        </h3>
        <div className="grid gap-2">
          <a
            href={`mailto:${student.email}`}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <Mail className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-blue-600 hover:underline">{student.email}</span>
          </a>
          {student.linkedin_profile && (
            <a
              href={student.linkedin_profile}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <Linkedin className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600 hover:underline">LinkedIn Profile</span>
              <ExternalLink className="h-3 w-3 ml-auto text-slate-400" />
            </a>
          )}
        </div>
      </div>

      {/* Education & Experience */}
      {(student.education || student.business_experience) && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Background
          </h3>
          <div className="space-y-2">
            {student.education && (
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500 mb-1">Education</p>
                <p className="text-sm">{student.education}</p>
              </div>
            )}
            {student.business_experience && (
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500 mb-1">Business Experience</p>
                <p className="text-sm">{student.business_experience}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assigned Client */}
      {student.clients && student.clients.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Assigned Client
          </h3>
          <div className="grid gap-2">
            {student.clients.map((client) => (
              <div key={client.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <Building2 className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">{client.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Directors */}
      {student.directors && student.directors.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Program Directors
          </h3>
          <div className="grid gap-2">
            {student.directors.map((director) => (
              <div key={director.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <Briefcase className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium">{director.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {student.semester && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="h-4 w-4" />
          <span>{student.semester}</span>
        </div>
      )}
    </div>
  )

  const renderClientContent = (client: ClientData) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar className={`h-16 w-16 ${getTypeBgColor()}`}>
          <AvatarFallback className={`${getTypeBgColor()} text-white text-xl`}>
            {getInitials(client.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">{client.name}</h2>
          {client.contact_name && <p className="text-sm text-slate-600">Contact: {client.contact_name}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {client.project_type && <Badge variant="outline">{client.project_type}</Badge>}
            {client.status && (
              <Badge variant="outline" className={client.status === "active" ? "text-green-600 border-green-300" : ""}>
                {client.status}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Contact Info */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Contact Information
        </h3>
        <div className="grid gap-2">
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <Mail className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-blue-600 hover:underline">{client.email}</span>
            </a>
          )}
          {client.website && (
            <a
              href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <Globe className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-blue-600 hover:underline">{client.website}</span>
              <ExternalLink className="h-3 w-3 ml-auto text-slate-400" />
            </a>
          )}
        </div>
      </div>

      {/* Alumni Mentor */}
      {client.alumni_mentor && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Alumni Mentor
          </h3>
          <div className="p-3 rounded-lg bg-slate-50">
            <span className="text-sm font-medium">{client.alumni_mentor}</span>
          </div>
        </div>
      )}

      {/* Directors */}
      {client.directors && client.directors.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Assigned Directors
          </h3>
          <div className="grid gap-2">
            {client.directors.map((director) => (
              <div key={director.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <Briefcase className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium">{director.name}</span>
                {director.isPrimary && (
                  <Badge className="ml-auto bg-amber-100 text-amber-700 text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Primary
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      {client.team_members && client.team_members.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Student Team ({client.team_members.length})
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {client.team_members.map((member) => (
              <div key={member.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                <GraduationCap className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {member.name}
                    {member.isTeamLeader && <span className="text-amber-500 ml-1">★</span>}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{member.clinic}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {client.semester && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="h-4 w-4" />
          <span>{client.semester}</span>
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    if (loading) {
      return (
        <div className="animate-pulse space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-slate-200 rounded w-48" />
              <div className="h-4 bg-slate-200 rounded w-32" />
            </div>
          </div>
          <div className="h-px bg-slate-200" />
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="h-12 bg-slate-200 rounded" />
          </div>
        </div>
      )
    }

    switch (type) {
      case "director":
        return renderDirectorContent(data as DirectorData)
      case "student":
        return renderStudentContent(data as StudentData)
      case "client":
        return renderClientContent(data as ClientData)
    }
  }

  const getTitle = () => {
    switch (type) {
      case "director":
        return "Director Profile"
      case "student":
        return "Student Profile"
      case "client":
        return "Client Profile"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
