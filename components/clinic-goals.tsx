"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Target, Edit2, Check, X } from "lucide-react"
import { useState } from "react"

interface ClinicGoal {
  clinic: string
  weeklyGoal: number
  monthlyGoal: number
  currentWeekHours: number
  currentMonthHours: number
}

interface ClinicGoalsProps {
  selectedWeek: string
  selectedClinic: string
}

export function ClinicGoals({ selectedWeek, selectedClinic }: ClinicGoalsProps) {
  // Default goals (these would be stored in a database in production)
  const [goals, setGoals] = useState<ClinicGoal[]>([
    { clinic: "Consulting", weeklyGoal: 40, monthlyGoal: 160, currentWeekHours: 24, currentMonthHours: 96 },
    { clinic: "Accounting", weeklyGoal: 30, monthlyGoal: 120, currentWeekHours: 3, currentMonthHours: 45 },
    { clinic: "Funding", weeklyGoal: 35, monthlyGoal: 140, currentWeekHours: 9.5, currentMonthHours: 67 },
    { clinic: "Marketing", weeklyGoal: 30, monthlyGoal: 120, currentWeekHours: 7, currentMonthHours: 52 },
  ])

  const [editingClinic, setEditingClinic] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({ weeklyGoal: 0, monthlyGoal: 0 })

  const filteredGoals = selectedClinic === "all" ? goals : goals.filter((g) => g.clinic === selectedClinic)

  const startEdit = (goal: ClinicGoal) => {
    setEditingClinic(goal.clinic)
    setEditValues({ weeklyGoal: goal.weeklyGoal, monthlyGoal: goal.monthlyGoal })
  }

  const saveEdit = (clinic: string) => {
    setGoals(
      goals.map((g) =>
        g.clinic === clinic ? { ...g, weeklyGoal: editValues.weeklyGoal, monthlyGoal: editValues.monthlyGoal } : g,
      ),
    )
    setEditingClinic(null)
  }

  const cancelEdit = () => {
    setEditingClinic(null)
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return "text-green-600"
    if (percentage >= 75) return "text-blue-600"
    if (percentage >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 100) return <Badge className="bg-green-600">On Track</Badge>
    if (percentage >= 75) return <Badge className="bg-blue-600">Good Progress</Badge>
    if (percentage >= 50) return <Badge className="bg-yellow-600">Needs Attention</Badge>
    return <Badge variant="destructive">Behind Schedule</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Target className="h-5 w-5" />
          Clinic Goals & Metrics
        </CardTitle>
        <CardDescription>Track progress toward weekly and monthly hour goals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {filteredGoals.map((goal) => {
            const weeklyPercentage = Math.round((goal.currentWeekHours / goal.weeklyGoal) * 100)
            const monthlyPercentage = Math.round((goal.currentMonthHours / goal.monthlyGoal) * 100)
            const isEditing = editingClinic === goal.clinic

            return (
              <div key={goal.clinic} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{goal.clinic}</h3>
                    {getStatusBadge(weeklyPercentage)}
                  </div>
                  {!isEditing ? (
                    <Button variant="ghost" size="sm" onClick={() => startEdit(goal)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => saveEdit(goal.clinic)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Weekly Goal */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">Weekly Goal</Label>
                        {isEditing && (
                          <Input
                            type="number"
                            value={editValues.weeklyGoal}
                            onChange={(e) => setEditValues({ ...editValues, weeklyGoal: Number(e.target.value) })}
                            className="w-20 h-7"
                          />
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${getStatusColor(weeklyPercentage)}`}>
                        {goal.currentWeekHours}h / {isEditing ? editValues.weeklyGoal : goal.weeklyGoal}h (
                        {weeklyPercentage}%)
                      </span>
                    </div>
                    <Progress value={Math.min(weeklyPercentage, 100)} className="h-2" />
                  </div>

                  {/* Monthly Goal */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">Monthly Goal</Label>
                        {isEditing && (
                          <Input
                            type="number"
                            value={editValues.monthlyGoal}
                            onChange={(e) => setEditValues({ ...editValues, monthlyGoal: Number(e.target.value) })}
                            className="w-20 h-7"
                          />
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${getStatusColor(monthlyPercentage)}`}>
                        {goal.currentMonthHours}h / {isEditing ? editValues.monthlyGoal : goal.monthlyGoal}h (
                        {monthlyPercentage}%)
                      </span>
                    </div>
                    <Progress value={Math.min(monthlyPercentage, 100)} className="h-2" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
