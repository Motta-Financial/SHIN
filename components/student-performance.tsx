"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Minus, Users } from "lucide-react"
import { useState, useEffect } from "react"

interface Director {
  id: string
  full_name: string
  clinicName?: string
}

interface StudentMetrics {
  name: string
  clinic: string
  currentWeekHours: number
  averageWeeklyHours: number
  totalSubmissions: number
  consistency: number // percentage
  trend: "up" | "down" | "stable"
}

interface StudentPerformanceProps {
  selectedWeeks: string[]
  selectedClinic: string
}

export function StudentPerformance({ selectedWeeks, selectedClinic }: StudentPerformanceProps) {
  const [students, setStudents] = useState<StudentMetrics[]>([])
  const [directors, setDirectors] = useState<Director[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [directorsRes, debriefsRes] = await Promise.all([
          fetch("/api/directors"),
          fetch("/api/supabase/debriefs"),
        ])

        if (directorsRes.ok) {
          const data = await directorsRes.json()
          setDirectors(data.directors || [])
        }

        if (debriefsRes.ok) {
          const data = await debriefsRes.json()
          const debriefs = data.debriefs || []

          // Group debriefs by student
          const studentMap = new Map<string, any[]>()
          debriefs.forEach((d: any) => {
            const name = d.student_name || d.studentName || "Unknown"
            if (!studentMap.has(name)) {
              studentMap.set(name, [])
            }
            studentMap.get(name)!.push(d)
          })

          // Calculate metrics for each student
          const studentMetrics: StudentMetrics[] = Array.from(studentMap.entries()).map(([name, records]) => {
            const totalHours = records.reduce((sum, r) => sum + (Number(r.hours_worked || r.hoursWorked) || 0), 0)
            const avgHours = records.length > 0 ? totalHours / records.length : 0
            const latestRecord = records[0]
            const currentWeekHours = Number(latestRecord?.hours_worked || latestRecord?.hoursWorked) || 0

            // Calculate consistency (percentage of weeks with submissions)
            const uniqueWeeks = new Set(records.map((r) => r.week_ending || r.weekEnding))
            const consistency = Math.min(100, (uniqueWeeks.size / Math.max(selectedWeeks.length, 1)) * 100)

            // Determine trend
            let trend: "up" | "down" | "stable" = "stable"
            if (records.length >= 2) {
              const recentHours = Number(records[0]?.hours_worked || records[0]?.hoursWorked) || 0
              const prevHours = Number(records[1]?.hours_worked || records[1]?.hoursWorked) || 0
              if (recentHours > prevHours * 1.1) trend = "up"
              else if (recentHours < prevHours * 0.9) trend = "down"
            }

            return {
              name,
              clinic: latestRecord?.clinic || "Unknown",
              currentWeekHours: Math.round(currentWeekHours * 10) / 10,
              averageWeeklyHours: Math.round(avgHours * 10) / 10,
              totalSubmissions: records.length,
              consistency: Math.round(consistency),
              trend,
            }
          })

          setStudents(studentMetrics)
        }
      } catch (error) {
        console.error("Error fetching student performance:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedWeeks])

  const filteredStudents = (() => {
    if (selectedClinic === "all") return students

    // Check if selectedClinic is a UUID
    const isUUID = selectedClinic.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    let filterClinicName = selectedClinic

    if (isUUID) {
      const director = directors.find((d) => d.id === selectedClinic)
      filterClinicName = director?.clinicName || selectedClinic
    }

    return students.filter((s) => {
      const normalizedStudentClinic = s.clinic.toLowerCase().replace(" clinic", "").trim()
      const normalizedFilter = filterClinicName.toLowerCase().replace(" clinic", "").trim()
      return normalizedStudentClinic === normalizedFilter
    })
  })()

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600" />
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
  }

  const getConsistencyColor = (consistency: number) => {
    if (consistency >= 90) return "text-green-600"
    if (consistency >= 75) return "text-blue-600"
    if (consistency >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getPeriodLabel = () => {
    if (selectedWeeks.length === 0) return "No Period Selected"
    if (selectedWeeks.length === 1) return "This Week"
    return `${selectedWeeks.length} Weeks`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Student Performance Trends
        </CardTitle>
        <CardDescription>
          Individual student metrics and consistency tracking
          {selectedWeeks.length > 1 && ` (${selectedWeeks.length} weeks)`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredStudents.map((student) => (
            <div key={student.name} className="p-4 rounded-lg border bg-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{student.name}</h4>
                    {getTrendIcon(student.trend)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {student.clinic}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{student.currentWeekHours}h</div>
                  <div className="text-xs text-muted-foreground">{getPeriodLabel()}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Avg Weekly</div>
                  <div className="font-semibold">{student.averageWeeklyHours}h</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Submissions</div>
                  <div className="font-semibold">{student.totalSubmissions}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Consistency</div>
                  <div className={`font-semibold ${getConsistencyColor(student.consistency)}`}>
                    {student.consistency}%
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Submission Consistency</span>
                  <span className="text-xs font-medium">{student.consistency}%</span>
                </div>
                <Progress value={student.consistency} className="h-1.5" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
