"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, AlertCircle } from "lucide-react"

interface SemesterConfig {
  id: string
  semester_name: string
  start_date: string
  end_date: string
  is_active: boolean
}

interface KeyDate {
  id: string
  date: string
  title: string
  description: string
  type: string
}

export function SemesterCalendar() {
  const [activeSemester, setActiveSemester] = useState<SemesterConfig | null>(null)
  const [keyDates, setKeyDates] = useState<KeyDate[]>([])
  const [currentWeek, setCurrentWeek] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSemesterInfo()
  }, [])

  const fetchSemesterInfo = async () => {
    try {
      const response = await fetch("/api/semester-config")
      const data = await response.json()

      const active = data.semesters?.find((s: SemesterConfig) => s.is_active)
      if (active) {
        setActiveSemester(active)
        calculateCurrentWeek(active.start_date)
      }
    } catch (error) {
      console.error("Error fetching semester info:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateCurrentWeek = (startDate: string) => {
    const start = new Date(startDate)
    const today = new Date()
    const diffTime = today.getTime() - start.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const weekNumber = Math.floor(diffDays / 7) + 1
    setCurrentWeek(weekNumber > 0 ? weekNumber : 0)
  }

  const getWeekEndDate = () => {
    if (!activeSemester) return null
    const start = new Date(activeSemester.start_date)
    const weekEnd = new Date(start)
    weekEnd.setDate(start.getDate() + currentWeek * 7 - 1)
    return weekEnd.toLocaleDateString()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">Loading semester information...</p>
        </CardContent>
      </Card>
    )
  }

  if (!activeSemester) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-destructive" />
            No Active Semester
          </CardTitle>
          <CardDescription>Please configure an active semester in the admin settings</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {activeSemester.semester_name}
        </CardTitle>
        <CardDescription>
          {new Date(activeSemester.start_date).toLocaleDateString()} -{" "}
          {new Date(activeSemester.end_date).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div>
            <p className="text-sm font-medium text-foreground">Current Week</p>
            <p className="text-2xl font-bold text-primary">Week {currentWeek}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">Week Ending</p>
            <p className="text-sm text-foreground">{getWeekEndDate()}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Semester Progress
          </h4>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(
                  ((new Date().getTime() - new Date(activeSemester.start_date).getTime()) /
                    (new Date(activeSemester.end_date).getTime() - new Date(activeSemester.start_date).getTime())) *
                    100,
                  100,
                )}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {Math.ceil((new Date(activeSemester.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}{" "}
            days remaining
          </p>
        </div>

        {keyDates.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Upcoming Key Dates</h4>
            {keyDates.slice(0, 5).map((date) => (
              <div key={date.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Badge variant="outline" className="mt-0.5">
                  {new Date(date.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{date.title}</p>
                  {date.description && <p className="text-xs text-muted-foreground">{date.description}</p>}
                </div>
                {date.type && (
                  <Badge variant="secondary" className="text-xs">
                    {date.type}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
