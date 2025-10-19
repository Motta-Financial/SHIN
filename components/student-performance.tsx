"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Minus, Users } from "lucide-react"
import { useState } from "react"

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
  selectedWeek: string
  selectedClinic: string
}

export function StudentPerformance({ selectedWeek, selectedClinic }: StudentPerformanceProps) {
  // Mock data - in production, this would be calculated from historical debrief data
  const [students] = useState<StudentMetrics[]>([
    {
      name: "Annalise Fosnight",
      clinic: "Consulting",
      currentWeekHours: 12,
      averageWeeklyHours: 10,
      totalSubmissions: 8,
      consistency: 95,
      trend: "up",
    },
    {
      name: "Franziska Greiner",
      clinic: "Consulting",
      currentWeekHours: 12,
      averageWeeklyHours: 11,
      totalSubmissions: 8,
      consistency: 90,
      trend: "stable",
    },
    {
      name: "Declan Leahy",
      clinic: "Accounting",
      currentWeekHours: 3,
      averageWeeklyHours: 8,
      totalSubmissions: 7,
      consistency: 75,
      trend: "down",
    },
    {
      name: "Urmi Vaghela",
      clinic: "Funding",
      currentWeekHours: 4,
      averageWeeklyHours: 6,
      totalSubmissions: 8,
      consistency: 85,
      trend: "down",
    },
    {
      name: "Mason Holt",
      clinic: "Funding",
      currentWeekHours: 3,
      averageWeeklyHours: 5,
      totalSubmissions: 7,
      consistency: 80,
      trend: "down",
    },
    {
      name: "Ishani Rana",
      clinic: "Funding",
      currentWeekHours: 2.5,
      averageWeeklyHours: 4,
      totalSubmissions: 8,
      consistency: 88,
      trend: "down",
    },
    {
      name: "Maura Sullivan",
      clinic: "Marketing",
      currentWeekHours: 5,
      averageWeeklyHours: 6,
      totalSubmissions: 8,
      consistency: 92,
      trend: "stable",
    },
    {
      name: "Margaret Distefano",
      clinic: "Marketing",
      currentWeekHours: 2,
      averageWeeklyHours: 5,
      totalSubmissions: 6,
      consistency: 70,
      trend: "down",
    },
  ])

  const filteredStudents = selectedClinic === "all" ? students : students.filter((s) => s.clinic === selectedClinic)

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Student Performance Trends
        </CardTitle>
        <CardDescription>Individual student metrics and consistency tracking</CardDescription>
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
                  <div className="text-xs text-muted-foreground">This Week</div>
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
