"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Key, Eye, EyeOff, Calendar, AlertTriangle, CheckCircle2, Lock } from "lucide-react"
import { useCurrentSemester } from "@/hooks/use-current-semester"

interface AttendancePassword {
  id: string
  week_number: number
  password: string
  week_start: string
  week_end: string
  created_by_name: string
  created_at: string
}

interface WeekSchedule {
  id: string
  week_number: number
  week_label: string
  week_start: string
  week_end: string
  is_break: boolean
}

interface AttendancePasswordManagerProps {
  currentDirectorName: string
  currentUserEmail: string
  onMissingPasswordsDetected?: (count: number) => void
}

export function AttendancePasswordManager({
  currentDirectorName,
  currentUserEmail,
  onMissingPasswordsDetected,
}: AttendancePasswordManagerProps) {
  const [passwords, setPasswords] = useState<AttendancePassword[]>([])
  const [schedule, setSchedule] = useState<WeekSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<WeekSchedule | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({})
  const [submitting, setSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { semesterId } = useCurrentSemester()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [passwordsRes, scheduleRes] = await Promise.all([
        fetch("/api/attendance-password"),
        fetch("/api/semester-schedule"),
      ])

      const passwordsData = await passwordsRes.json()
      const scheduleData = await scheduleRes.json()

      setPasswords(passwordsData.passwords || [])
      setSchedule((scheduleData.schedules || []).filter((w: WeekSchedule) => !w.is_break))
    } catch (error) {
      console.error("Error fetching attendance password data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async () => {
    if (!selectedWeek || !newPassword.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/attendance-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber: selectedWeek.week_number,
          semesterId: semesterId,
          password: newPassword,
          weekStart: selectedWeek.week_start,
          weekEnd: selectedWeek.week_end,
          createdByName: currentDirectorName,
          userEmail: currentUserEmail,
        }),
      })

      if (response.ok) {
        await fetchData()
        setNewPassword("")
        setSelectedWeek(null)
        setDialogOpen(false)
      }
    } catch (error) {
      console.error("Error setting password:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const getCurrentWeek = () => {
    const today = new Date()
    return schedule.find((w) => {
      const start = new Date(w.week_start)
      const end = new Date(w.week_end)
      return today >= start && today <= end
    })
  }

  const currentWeek = getCurrentWeek()
  const currentWeekPassword = currentWeek ? passwords.find((p) => p.week_number === currentWeek.week_number) : null
  const upcomingWeeks = schedule
    .filter((w) => {
      const start = new Date(w.week_start)
      return start > new Date()
    })
    .slice(0, 3)

  const weeksWithoutPassword = schedule.filter((w) => {
    const hasPassword = passwords.some((p) => p.week_number === w.week_number)
    const isPast = new Date(w.week_end) < new Date()
    return !hasPassword && !isPast
  })

  useEffect(() => {
    if (onMissingPasswordsDetected) {
      onMissingPasswordsDetected(weeksWithoutPassword.length)
    }
  }, [weeksWithoutPassword.length, onMissingPasswordsDetected])

  if (loading) {
    return (
      <Card className="border-blue-200">
        <CardContent className="pt-6">
          <p className="text-center text-slate-500">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Alert for missing passwords */}
      {weeksWithoutPassword.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{weeksWithoutPassword.length} week(s)</strong> do not have attendance passwords set. Students will
            not be able to submit attendance for these weeks.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Week Password Display */}
      {currentWeek && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Current Week Password
            </CardTitle>
            <CardDescription className="text-blue-700">
              Week {currentWeek.week_number}: {currentWeek.week_label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentWeekPassword ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Key className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Password</p>
                      <p className="text-lg font-mono font-bold text-slate-900">
                        {showPassword["current"] ? currentWeekPassword.password : "••••••••"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))}
                  >
                    {showPassword["current"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-blue-600">
                  Set by {currentWeekPassword.created_by_name} on{" "}
                  {new Date(currentWeekPassword.created_at).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  No password set for this week. Set one now to allow students to submit attendance.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manage Passwords */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Manage Attendance Passwords
              </CardTitle>
              <CardDescription>Set unique passwords for each week of the semester</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Key className="h-4 w-4 mr-2" />
                  Set Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Attendance Password</DialogTitle>
                  <DialogDescription>
                    Choose a week and set a unique password for attendance submission
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Select Week</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={selectedWeek?.id || ""}
                      onChange={(e) => {
                        const week = schedule.find((w) => w.id === e.target.value)
                        setSelectedWeek(week || null)
                      }}
                    >
                      <option value="">Choose a week...</option>
                      {schedule.map((week) => {
                        const hasPassword = passwords.some((p) => p.week_number === week.week_number)
                        return (
                          <option key={week.id} value={week.id}>
                            Week {week.week_number}: {week.week_label} {hasPassword ? "(Password Set)" : ""}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="text"
                      placeholder="Enter unique password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      This password will be shared with students during class
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSetPassword} disabled={submitting || !selectedWeek || !newPassword.trim()}>
                    {submitting ? "Setting..." : "Set Password"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {schedule.map((week) => {
              const weekPassword = passwords.find((p) => p.week_number === week.week_number)
              const isPast = new Date(week.week_end) < new Date()
              const isCurrent = currentWeek?.week_number === week.week_number

              return (
                <div
                  key={week.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isCurrent
                      ? "bg-blue-50 border-blue-200"
                      : weekPassword
                        ? "bg-green-50 border-green-200"
                        : isPast
                          ? "bg-slate-50 border-slate-200 opacity-60"
                          : "bg-amber-50 border-amber-200"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">
                        Week {week.week_number}: {week.week_label}
                      </p>
                      {isCurrent && <Badge className="bg-blue-600">Current</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(week.week_start).toLocaleDateString()} - {new Date(week.week_end).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {weekPassword ? (
                      <>
                        <span className="font-mono text-sm">
                          {showPassword[week.id] ? weekPassword.password : "••••••••"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setShowPassword((prev) => ({
                              ...prev,
                              [week.id]: !prev[week.id],
                            }))
                          }
                        >
                          {showPassword[week.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Set
                        </Badge>
                      </>
                    ) : isPast ? (
                      <Badge variant="outline" className="text-slate-400">
                        Past Week
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Not Set
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
