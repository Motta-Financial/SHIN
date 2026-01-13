"use client"

import type React from "react"

import { useState } from "react"
import { ChevronDown, ChevronUp, Clock, FileText, CheckCircle2, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface AttendanceRecord {
  id: string
  weekNumber: number
  classDate?: string
  submittedAt?: string
  status?: string
  notes?: string
}

interface DebriefRecord {
  id: string
  weekNumber: number
  weekEnding?: string
  submittedAt?: string
  hours?: number
  accomplishments?: string
  challenges?: string
  nextSteps?: string
  notes?: string
  status?: string
}

interface ExpandableRecordCardProps {
  type: "attendance" | "debrief" | "meeting"
  weekNumber: number
  weekLabel?: string
  weekStart?: string
  weekEnd?: string
  isCurrentWeek?: boolean
  isBreak?: boolean
  sessionFocus?: string
  attendanceRecord?: AttendanceRecord | null
  debriefRecord?: DebriefRecord | null
  onSubmitAttendance?: () => void
  onSubmitDebrief?: () => void
  onViewDebrief?: (debrief: DebriefRecord) => void
  defaultExpanded?: boolean
}

export function ExpandableRecordCard({
  type,
  weekNumber,
  weekLabel,
  weekStart,
  weekEnd,
  isCurrentWeek,
  isBreak,
  sessionFocus,
  attendanceRecord,
  debriefRecord,
  onSubmitAttendance,
  onSubmitDebrief,
  onViewDebrief,
  defaultExpanded = false,
}: ExpandableRecordCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const hasAttendance = !!attendanceRecord
  const hasDebrief = !!debriefRecord
  const isPast = weekEnd ? new Date(weekEnd) < new Date() : false
  const isCurrent =
    isCurrentWeek || (weekStart && weekEnd && new Date(weekStart) <= new Date() && new Date(weekEnd) >= new Date())

  const hasRecordsToShow = hasAttendance || hasDebrief

  const getBgColor = () => {
    if (isBreak) return "bg-amber-50 border-amber-200"
    if (isCurrent) return "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
    if (isPast) {
      if (hasAttendance && hasDebrief) return "bg-green-50 border-green-200"
      return "bg-red-50 border-red-200"
    }
    return "bg-slate-50 border-slate-200"
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className={`rounded-lg border transition-all ${getBgColor()}`}>
        {/* Header - Always Visible */}
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-black/5 transition-colors">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-center min-w-[60px]">
                  <p className="text-xs text-muted-foreground">Week</p>
                  <p className="text-xl font-bold">{weekNumber}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{weekLabel || `Week ${weekNumber}`}</p>
                    {isBreak && <Badge className="bg-amber-500">Break</Badge>}
                    {isCurrent && <Badge className="bg-blue-600">Current Week</Badge>}
                  </div>
                  {weekStart && weekEnd && (
                    <p className="text-sm text-muted-foreground">
                      {new Date(weekStart).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      -{" "}
                      {new Date(weekEnd).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                  {sessionFocus && <p className="text-xs text-slate-600 mt-1">{sessionFocus}</p>}
                </div>
              </div>

              {!isBreak && (
                <div className="flex items-center gap-3">
                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    {hasAttendance ? (
                      <Badge className="bg-green-600 text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Attended
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-300 text-slate-500">
                        No Attendance
                      </Badge>
                    )}
                    {hasDebrief ? (
                      <Badge className="bg-blue-600 text-white">
                        <FileText className="h-3 w-3 mr-1" />
                        Debrief
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-300 text-slate-500">
                        No Debrief
                      </Badge>
                    )}
                  </div>

                  {/* Expand/Collapse Button */}
                  {hasRecordsToShow && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Expanded Content - Record Details */}
        <CollapsibleContent>
          {hasRecordsToShow && (
            <div className="px-4 pb-4 border-t border-current/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Attendance Details */}
                {hasAttendance && attendanceRecord && (
                  <Card className="border-green-200 bg-white/80">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Attendance Record
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      {attendanceRecord.classDate && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Class Date: {new Date(attendanceRecord.classDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {attendanceRecord.submittedAt && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Submitted: {new Date(attendanceRecord.submittedAt).toLocaleString()}</span>
                        </div>
                      )}
                      {attendanceRecord.status && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {attendanceRecord.status}
                          </Badge>
                        </div>
                      )}
                      {attendanceRecord.notes && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                          <p className="font-medium text-green-800 mb-1">Notes:</p>
                          <p className="text-green-700">{attendanceRecord.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Debrief Details */}
                {hasDebrief && debriefRecord && (
                  <Card className="border-blue-200 bg-white/80">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                        <FileText className="h-4 w-4" />
                        Debrief Record
                        {onViewDebrief && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto h-6 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              onViewDebrief(debriefRecord)
                            }}
                          >
                            View Full
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      {debriefRecord.hours !== undefined && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            Hours Logged: <strong>{debriefRecord.hours}</strong>
                          </span>
                        </div>
                      )}
                      {debriefRecord.submittedAt && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Submitted: {new Date(debriefRecord.submittedAt).toLocaleString()}</span>
                        </div>
                      )}
                      {debriefRecord.accomplishments && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                          <p className="font-medium text-blue-800 mb-1">Accomplishments:</p>
                          <p className="text-blue-700 line-clamp-3">{debriefRecord.accomplishments}</p>
                        </div>
                      )}
                      {debriefRecord.challenges && (
                        <div className="mt-2 p-2 bg-amber-50 rounded text-xs">
                          <p className="font-medium text-amber-800 mb-1">Challenges:</p>
                          <p className="text-amber-700 line-clamp-3">{debriefRecord.challenges}</p>
                        </div>
                      )}
                      {debriefRecord.nextSteps && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                          <p className="font-medium text-green-800 mb-1">Next Steps:</p>
                          <p className="text-green-700 line-clamp-3">{debriefRecord.nextSteps}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Action Buttons if records are missing */}
              {(!hasAttendance || !hasDebrief) && !isBreak && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-current/10">
                  {!hasAttendance && onSubmitAttendance && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-300 text-green-700 hover:bg-green-50 bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSubmitAttendance()
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Submit Attendance
                    </Button>
                  )}
                  {!hasDebrief && onSubmitDebrief && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSubmitDebrief()
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Submit Debrief
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

// Compact version for use in summary widgets
interface ExpandableRecordSummaryProps {
  title: string
  icon: React.ReactNode
  count: number
  total: number
  records: Array<{
    id: string
    label: string
    date?: string
    status?: "complete" | "pending" | "missing"
    details?: string
  }>
  emptyMessage?: string
  accentColor?: "green" | "blue" | "purple" | "amber"
}

export function ExpandableRecordSummary({
  title,
  icon,
  count,
  total,
  records,
  emptyMessage = "No records to display",
  accentColor = "blue",
}: ExpandableRecordSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const colors = {
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
      badge: "bg-green-600",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      badge: "bg-blue-600",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-700",
      badge: "bg-purple-600",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      badge: "bg-amber-600",
    },
  }

  const colorScheme = colors[accentColor]

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className={`${colorScheme.border} ${colorScheme.bg}/50`}>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-4 cursor-pointer hover:bg-black/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={colorScheme.text}>{icon}</div>
                <div>
                  <p className={`text-sm ${colorScheme.text}`}>{title}</p>
                  <p className={`text-2xl font-bold ${colorScheme.text}`}>
                    {count}/{total}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-6 pb-4 border-t border-current/10">
            {records.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{emptyMessage}</p>
            ) : (
              <div className="space-y-2 mt-4 max-h-[200px] overflow-y-auto">
                {records.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-2 rounded bg-white/60 text-sm">
                    <div className="flex items-center gap-2">
                      {record.status === "complete" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {record.status === "pending" && <Clock className="h-4 w-4 text-amber-600" />}
                      {record.status === "missing" && <div className="h-4 w-4 rounded-full border-2 border-red-300" />}
                      <span>{record.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {record.date && <span>{record.date}</span>}
                      {record.details && (
                        <Badge variant="outline" className="text-xs">
                          {record.details}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
