"use client"

import { useState } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface ScheduleWeek {
  week_label: string
  week_start: string
  week_end: string
  week_number: number | null
  session_focus: string
  is_break: boolean
}

export default function ScheduleAdminPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [schedule, setSchedule] = useState<ScheduleWeek[]>([])

  const importSchedule = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/import-schedule", { method: "POST" })
      const data = await response.json()
      setResult(data)

      // Fetch the schedule after import
      const scheduleResponse = await fetch("/api/import-schedule")
      const scheduleData = await scheduleResponse.json()
      if (scheduleData.schedule) {
        setSchedule(scheduleData.schedule)
      }
    } catch (error) {
      setResult({ success: false, error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const fetchSchedule = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/import-schedule")
      const data = await response.json()
      if (data.schedule) {
        setSchedule(data.schedule)
      }
      setResult({ success: true, message: `Fetched ${data.schedule?.length || 0} weeks` })
    } catch (error) {
      setResult({ success: false, error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>
      <main className="pl-52 pt-14 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Semester Schedule Management</h1>
            <p className="text-slate-500 mt-1">Import and manage the FALL 2025 course schedule</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Calendar className="w-4 h-4 mr-2" />
            FALL 2025
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Import Schedule</CardTitle>
            <CardDescription>
              Import the FALL 2025 semester schedule into Supabase. This will populate the week selector dropdown across
              all dashboards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={importSchedule} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Import FALL 2025 Schedule
              </Button>
              <Button variant="outline" onClick={fetchSchedule} disabled={loading}>
                View Current Schedule
              </Button>
            </div>

            {result && (
              <div
                className={`p-4 rounded-lg ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
              >
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={result.success ? "text-green-800" : "text-red-800"}>
                    {result.message || result.error}
                  </span>
                </div>
                {result.results && (
                  <div className="mt-2 text-sm text-slate-600">
                    <p>Inserted: {result.results.inserted}</p>
                    <p>Duplicates: {result.results.duplicates}</p>
                    <p>Total in database: {result.results.totalInDatabase}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {schedule.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Current Schedule ({schedule.length} weeks)</CardTitle>
              <CardDescription>FALL 2025 semester weeks loaded in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {schedule.map((week, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${week.is_break ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={week.is_break ? "secondary" : "default"}>{week.week_label}</Badge>
                        <span className="text-sm text-slate-600">
                          {new Date(week.week_start).toLocaleDateString()} -{" "}
                          {new Date(week.week_end).toLocaleDateString()}
                        </span>
                      </div>
                      {week.is_break && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          Break
                        </Badge>
                      )}
                    </div>
                    {week.session_focus && (
                      <p className="mt-2 text-sm text-slate-500 line-clamp-2">{week.session_focus}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
