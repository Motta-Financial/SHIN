"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Mail, Linkedin, GraduationCap, Briefcase, Users, Building2 } from "lucide-react"

interface StudentProfile {
  id: string
  full_name: string
  first_name: string
  last_name: string
  email: string
  university_id?: string
  clinic: string
  client_team?: string
  is_team_leader: boolean
  academic_level?: string
  education?: string
  linkedin_profile?: string
  business_experience?: string
  semester: string
  status: string
  clients: Array<{
    id: string
    name: string
    role: string
  }>
  directors: Array<{
    id: string
    full_name: string
    email: string
    role: string
  }>
}

interface StudentProfileCardProps {
  student: StudentProfile
}

export function StudentProfileCard({ student }: StudentProfileCardProps) {
  const initials = `${student.first_name?.charAt(0) || ""}${student.last_name?.charAt(0) || ""}`

  const getClinicColor = (clinic: string) => {
    const colors: Record<string, string> = {
      "Consulting Clinic": "bg-blue-500",
      "Marketing Clinic": "bg-purple-500",
      "Accounting Clinic": "bg-green-500",
      Consulting: "bg-blue-500",
      Marketing: "bg-purple-500",
      Accounting: "bg-green-500",
    }
    return colors[clinic] || "bg-gray-500"
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className={`h-16 w-16 ${getClinicColor(student.clinic)}`}>
            <AvatarFallback className="text-white text-xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{student.full_name}</CardTitle>
              {student.is_team_leader && (
                <Badge variant="default" className="bg-amber-500">
                  Team Leader
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{student.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{student.clinic}</Badge>
              <Badge variant="secondary">{student.semester}</Badge>
              {student.status && (
                <Badge variant={student.status === "active" ? "default" : "outline"}>{student.status}</Badge>
              )}
            </div>
          </div>
          {student.linkedin_profile && (
            <Button variant="ghost" size="icon" asChild>
              <a href={student.linkedin_profile} target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-5 w-5 text-blue-600" />
              </a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Education & Experience */}
        <div className="grid gap-4 md:grid-cols-2">
          {student.education && (
            <div className="flex items-start gap-2">
              <GraduationCap className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Education</p>
                <p className="text-sm">{student.education}</p>
              </div>
            </div>
          )}
          {student.academic_level && (
            <div className="flex items-start gap-2">
              <GraduationCap className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Academic Level</p>
                <p className="text-sm">{student.academic_level}</p>
              </div>
            </div>
          )}
        </div>

        {student.business_experience && (
          <div className="flex items-start gap-2">
            <Briefcase className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Business Experience</p>
              <p className="text-sm">{student.business_experience}</p>
            </div>
          </div>
        )}

        {/* Assigned Clients */}
        {student.clients && student.clients.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Assigned Clients</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {student.clients.map((client) => (
                <Badge key={client.id} variant="outline" className="gap-1">
                  {client.name}
                  {client.role === "Team Leader" && <span className="text-amber-500">★</span>}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Directors */}
        {student.directors && student.directors.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Clinic Directors</p>
            </div>
            <div className="space-y-2">
              {student.directors.map((director) => (
                <div key={director.id} className="flex items-center justify-between text-sm">
                  <span>{director.full_name}</span>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`mailto:${director.email}`}>
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
