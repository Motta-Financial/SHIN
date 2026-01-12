"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, Calendar } from "lucide-react"
import { DemoStudentSelector } from "./demo-student-selector"
import { useDemoMode } from "@/contexts/demo-mode-context"

interface StudentPortalHeaderProps {
  loading?: boolean
  currentStudent: {
    firstName?: string
    lastName?: string
    fullName: string
    email: string
    clinic: string
    clientName?: string
    isTeamLeader: boolean
  } | null
  totalHours: number
  totalAttendance: number
  onStudentChange?: (studentId: string) => void
}

export function StudentPortalHeader({
  loading,
  currentStudent,
  totalHours,
  totalAttendance,
  onStudentChange,
}: StudentPortalHeaderProps) {
  const { isDemoMode } = useDemoMode()

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 py-4 px-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!currentStudent) return null

  const initials =
    `${currentStudent.firstName?.[0] || currentStudent.fullName?.split(" ")[0]?.[0] || ""}${currentStudent.lastName?.[0] || currentStudent.fullName?.split(" ")[1]?.[0] || ""}`.toUpperCase()

  return (
    <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 py-4 px-6 mb-6 rounded-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Student Info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-800">{currentStudent.fullName}</h2>
              {currentStudent.isTeamLeader && (
                <Badge variant="secondary" className="text-xs">
                  Team Leader
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>{currentStudent.clinic}</span>
              {currentStudent.clientName && (
                <>
                  <span className="text-slate-300">|</span>
                  <span>{currentStudent.clientName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Demo Selector + Quick Stats */}
        <div className="flex flex-wrap items-center gap-4">
          {isDemoMode && <DemoStudentSelector onStudentChange={onStudentChange} />}

          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">{totalHours.toFixed(1)} hrs</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">{totalAttendance} classes</span>
          </div>
        </div>
      </div>
    </div>
  )
}
