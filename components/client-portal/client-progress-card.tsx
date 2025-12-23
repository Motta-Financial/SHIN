"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Clock, Users, Calendar, Activity } from "lucide-react"

interface WeeklyProgress {
  week_ending: string
  hours: number
  activities: { student: string; summary: string; hours: number }[]
  students: string[]
  studentCount: number
}

interface ClientProgressCardProps {
  totalHours: number
  uniqueStudents: number
  weeklyProgress: WeeklyProgress[]
  loading?: boolean
}

export function ClientProgressCard({ totalHours, uniqueStudents, weeklyProgress, loading }: ClientProgressCardProps) {
  const hoursTarget = 60 // Semester target
  const progressPercent = Math.min((totalHours / hoursTarget) * 100, 100)

  if (loading) {
    return (
      <Card className="p-5 border-slate-200 bg-white">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
          <TrendingUp className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Project Progress</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5 border-slate-200 bg-white">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
        <TrendingUp className="h-5 w-5 text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-900">Project Progress</h2>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Overall Progress</span>
          <span className="text-sm text-slate-500">
            {totalHours.toFixed(1)} / {hoursTarget} hours
          </span>
        </div>
        <Progress value={progressPercent} className="h-3" />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-400">{progressPercent.toFixed(0)}% Complete</span>
          {progressPercent >= 100 ? (
            <Badge className="bg-emerald-100 text-emerald-700 text-xs">Target Reached</Badge>
          ) : progressPercent >= 60 ? (
            <Badge className="bg-blue-100 text-blue-700 text-xs">On Track</Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-700 text-xs">In Progress</Badge>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-medium">Total Hours</span>
          </div>
          <p className="text-xl font-bold text-blue-800">{totalHours.toFixed(1)}</p>
        </div>
        <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="text-xs text-purple-700 font-medium">Team Members</span>
          </div>
          <p className="text-xl font-bold text-purple-800">{uniqueStudents}</p>
        </div>
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-emerald-700 font-medium">Weeks Active</span>
          </div>
          <p className="text-xl font-bold text-emerald-800">{weeklyProgress.length}</p>
        </div>
      </div>

      {/* Weekly Activity */}
      <div>
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
          <Activity className="h-3 w-3" />
          Recent Activity
        </h3>
        {weeklyProgress.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Activity className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No activity recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {weeklyProgress.slice(0, 5).map((week) => (
              <div key={week.week_ending} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    Week of {new Date(week.week_ending).toLocaleDateString()}
                  </Badge>
                  <span className="text-xs font-medium text-slate-600">{week.hours.toFixed(1)} hrs</span>
                </div>
                <div className="space-y-1">
                  {week.activities.slice(0, 3).map((activity, idx) => (
                    <div key={idx} className="text-xs text-slate-600">
                      <span className="font-medium">{activity.student}:</span>{" "}
                      <span className="text-slate-500 line-clamp-1">{activity.summary}</span>
                    </div>
                  ))}
                  {week.activities.length > 3 && (
                    <p className="text-xs text-slate-400 italic">+{week.activities.length - 3} more activities</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
