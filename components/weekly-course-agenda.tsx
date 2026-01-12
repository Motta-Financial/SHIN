"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Clock,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  Coffee,
} from "lucide-react"

interface Activity {
  id: string
  time: string
  title: string
  description: string
  duration: number
  type: "lecture" | "workshop" | "meeting" | "break" | "presentation" | "other"
}

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  type: "reading" | "deliverable" | "quiz" | "presentation" | "other"
}

interface WeekSchedule {
  id: string
  week_number: number
  week_label: string
  week_start: string
  week_end: string
  session_focus: string
  activities: Activity[]
  assignments: Assignment[]
  notes: string
  class_time_minutes: number
  clinic_time_minutes: number
  is_break: boolean
  semester: string
  created_at: string
  updated_at: string
}

interface WeeklyCourseAgendaProps {
  semester?: string
}

const activityTypeColors: Record<string, string> = {
  lecture: "bg-blue-100 text-blue-800 border-blue-200",
  workshop: "bg-purple-100 text-purple-800 border-purple-200",
  meeting: "bg-green-100 text-green-800 border-green-200",
  break: "bg-amber-100 text-amber-800 border-amber-200",
  presentation: "bg-pink-100 text-pink-800 border-pink-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
}

const assignmentTypeColors: Record<string, string> = {
  reading: "bg-blue-100 text-blue-800",
  deliverable: "bg-green-100 text-green-800",
  quiz: "bg-red-100 text-red-800",
  presentation: "bg-purple-100 text-purple-800",
  other: "bg-gray-100 text-gray-800",
}

export function WeeklyCourseAgenda({ semester = "Spring 2026" }: WeeklyCourseAgendaProps) {
  const [schedules, setSchedules] = useState<WeekSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<number>(1)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [showAddWeekDialog, setShowAddWeekDialog] = useState(false)
  const [showAddActivityDialog, setShowAddActivityDialog] = useState(false)
  const [showAddAssignmentDialog, setShowAddAssignmentDialog] = useState(false)
  const [saving, setSaving] = useState(false)

  // New week form state
  const [newWeek, setNewWeek] = useState({
    week_number: 1,
    week_label: "",
    week_start: "",
    week_end: "",
    session_focus: "",
    is_break: false,
  })

  // New activity form state
  const [newActivity, setNewActivity] = useState<Omit<Activity, "id">>({
    time: "5:00 PM",
    title: "",
    description: "",
    duration: 30,
    type: "lecture",
  })

  // New assignment form state
  const [newAssignment, setNewAssignment] = useState<Omit<Assignment, "id">>({
    title: "",
    description: "",
    dueDate: "",
    type: "deliverable",
  })

  useEffect(() => {
    fetchSchedules()
  }, [semester])

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/semester-schedule?semester=${encodeURIComponent(semester)}`)
      const data = await response.json()
      if (data.schedules) {
        setSchedules(data.schedules)
        if (data.schedules.length > 0) {
          setSelectedWeek(data.schedules[0].week_number)
        }
      }
    } catch (error) {
      console.error("Error fetching schedules:", error)
    } finally {
      setLoading(false)
    }
  }

  const currentSchedule = schedules.find((s) => s.week_number === selectedWeek)

  const updateSchedule = async (updates: Partial<WeekSchedule>) => {
    if (!currentSchedule) return
    setSaving(true)
    try {
      const response = await fetch("/api/semester-schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentSchedule.id, ...updates }),
      })
      const data = await response.json()
      if (data.schedule) {
        setSchedules(schedules.map((s) => (s.id === data.schedule.id ? data.schedule : s)))
      }
    } catch (error) {
      console.error("Error updating schedule:", error)
    } finally {
      setSaving(false)
      setEditingField(null)
    }
  }

  const addWeek = async () => {
    try {
      const response = await fetch("/api/semester-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newWeek,
          week_label: newWeek.week_label || `Week ${newWeek.week_number}`,
          activities: [],
          assignments: [],
          notes: "",
          class_time_minutes: 90,
          clinic_time_minutes: 90,
          semester,
        }),
      })
      const data = await response.json()
      if (data.schedule) {
        setSchedules([...schedules, data.schedule].sort((a, b) => a.week_number - b.week_number))
        setSelectedWeek(data.schedule.week_number)
        setShowAddWeekDialog(false)
        setNewWeek({
          week_number: schedules.length + 2,
          week_label: "",
          week_start: "",
          week_end: "",
          session_focus: "",
          is_break: false,
        })
      }
    } catch (error) {
      console.error("Error adding week:", error)
    }
  }

  const deleteWeek = async (id: string) => {
    if (!confirm("Are you sure you want to delete this week?")) return
    try {
      await fetch(`/api/semester-schedule?id=${id}`, { method: "DELETE" })
      const remaining = schedules.filter((s) => s.id !== id)
      setSchedules(remaining)
      if (remaining.length > 0) {
        setSelectedWeek(remaining[0].week_number)
      }
    } catch (error) {
      console.error("Error deleting week:", error)
    }
  }

  const addActivity = async () => {
    if (!currentSchedule || !newActivity.title) return
    const activity: Activity = {
      id: crypto.randomUUID(),
      ...newActivity,
    }
    const updatedActivities = [...(currentSchedule.activities || []), activity]
    await updateSchedule({ activities: updatedActivities })
    setShowAddActivityDialog(false)
    setNewActivity({
      time: "5:00 PM",
      title: "",
      description: "",
      duration: 30,
      type: "lecture",
    })
  }

  const removeActivity = async (activityId: string) => {
    if (!currentSchedule) return
    const updatedActivities = currentSchedule.activities.filter((a) => a.id !== activityId)
    await updateSchedule({ activities: updatedActivities })
  }

  const addAssignment = async () => {
    if (!currentSchedule || !newAssignment.title) return
    const assignment: Assignment = {
      id: crypto.randomUUID(),
      ...newAssignment,
    }
    const updatedAssignments = [...(currentSchedule.assignments || []), assignment]
    await updateSchedule({ assignments: updatedAssignments })
    setShowAddAssignmentDialog(false)
    setNewAssignment({
      title: "",
      description: "",
      dueDate: "",
      type: "deliverable",
    })
  }

  const removeAssignment = async (assignmentId: string) => {
    if (!currentSchedule) return
    const updatedAssignments = currentSchedule.assignments.filter((a) => a.id !== assignmentId)
    await updateSchedule({ assignments: updatedAssignments })
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center text-muted-foreground">
          <div className="animate-pulse">Loading weekly agendas...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Week Selector */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b bg-muted/30 rounded-t-lg py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Weekly Course Agenda - {semester}
            </CardTitle>
            <Dialog open={showAddWeekDialog} onOpenChange={setShowAddWeekDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Week
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Week</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Week Number</Label>
                      <Input
                        type="number"
                        value={newWeek.week_number}
                        onChange={(e) => setNewWeek({ ...newWeek, week_number: Number.parseInt(e.target.value) })}
                        min={1}
                        max={16}
                      />
                    </div>
                    <div>
                      <Label>Week Label</Label>
                      <Input
                        value={newWeek.week_label}
                        onChange={(e) => setNewWeek({ ...newWeek, week_label: e.target.value })}
                        placeholder={`Week ${newWeek.week_number}`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={newWeek.week_start}
                        onChange={(e) => setNewWeek({ ...newWeek, week_start: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={newWeek.week_end}
                        onChange={(e) => setNewWeek({ ...newWeek, week_end: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Session Focus / Topic</Label>
                    <Input
                      value={newWeek.session_focus}
                      onChange={(e) => setNewWeek({ ...newWeek, session_focus: e.target.value })}
                      placeholder="e.g., Project Planning & SOW Development"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newWeek.is_break}
                      onCheckedChange={(checked) => setNewWeek({ ...newWeek, is_break: checked })}
                    />
                    <Label>This is a break week (no class)</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddWeekDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addWeek}>Add Week</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No weeks added yet. Click "Add Week" to create your course schedule.</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const currentIndex = schedules.findIndex((s) => s.week_number === selectedWeek)
                  if (currentIndex > 0) {
                    setSelectedWeek(schedules[currentIndex - 1].week_number)
                  }
                }}
                disabled={schedules.findIndex((s) => s.week_number === selectedWeek) === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-2 flex-1 overflow-x-auto">
                {schedules.map((schedule) => (
                  <Button
                    key={schedule.id}
                    variant={selectedWeek === schedule.week_number ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedWeek(schedule.week_number)}
                    className={`whitespace-nowrap ${schedule.is_break ? "border-amber-300 bg-amber-50" : ""}`}
                  >
                    {schedule.is_break && <Coffee className="h-3 w-3 mr-1" />}
                    {schedule.week_label || `Week ${schedule.week_number}`}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const currentIndex = schedules.findIndex((s) => s.week_number === selectedWeek)
                  if (currentIndex < schedules.length - 1) {
                    setSelectedWeek(schedules[currentIndex + 1].week_number)
                  }
                }}
                disabled={schedules.findIndex((s) => s.week_number === selectedWeek) === schedules.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Week Details */}
      {currentSchedule && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Week Header Card */}
            <Card className={`border-0 shadow-sm ${currentSchedule.is_break ? "bg-amber-50" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    {editingField === "week_label" ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={currentSchedule.week_label}
                          onChange={(e) =>
                            setSchedules(
                              schedules.map((s) =>
                                s.id === currentSchedule.id ? { ...s, week_label: e.target.value } : s,
                              ),
                            )
                          }
                          className="text-xl font-bold h-10"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateSchedule({ week_label: currentSchedule.week_label })}
                        >
                          <Save className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingField(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <h2 className="text-xl font-bold">
                          {currentSchedule.week_label || `Week ${currentSchedule.week_number}`}
                        </h2>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => setEditingField("week_label")}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        {currentSchedule.is_break && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200">Break Week</Badge>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {formatDate(currentSchedule.week_start)} - {formatDate(currentSchedule.week_end)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => deleteWeek(currentSchedule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Session Focus */}
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Session Focus</Label>
                  {editingField === "session_focus" ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={currentSchedule.session_focus || ""}
                        onChange={(e) =>
                          setSchedules(
                            schedules.map((s) =>
                              s.id === currentSchedule.id ? { ...s, session_focus: e.target.value } : s,
                            ),
                          )
                        }
                        placeholder="Enter session focus..."
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => updateSchedule({ session_focus: currentSchedule.session_focus })}
                      >
                        <Save className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingField(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group mt-1">
                      <p className="text-base font-medium">
                        {currentSchedule.session_focus || (
                          <span className="text-muted-foreground italic">No focus set</span>
                        )}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => setEditingField("session_focus")}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Time Allocations */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Class Time</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        value={currentSchedule.class_time_minutes || 90}
                        onChange={(e) =>
                          setSchedules(
                            schedules.map((s) =>
                              s.id === currentSchedule.id
                                ? { ...s, class_time_minutes: Number.parseInt(e.target.value) }
                                : s,
                            ),
                          )
                        }
                        onBlur={() => updateSchedule({ class_time_minutes: currentSchedule.class_time_minutes })}
                        className="w-20 h-8"
                        min={0}
                      />
                      <span className="text-sm text-muted-foreground">minutes</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Clinic Time</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        value={currentSchedule.clinic_time_minutes || 90}
                        onChange={(e) =>
                          setSchedules(
                            schedules.map((s) =>
                              s.id === currentSchedule.id
                                ? { ...s, clinic_time_minutes: Number.parseInt(e.target.value) }
                                : s,
                            ),
                          )
                        }
                        onBlur={() => updateSchedule({ clinic_time_minutes: currentSchedule.clinic_time_minutes })}
                        className="w-20 h-8"
                        min={0}
                      />
                      <span className="text-sm text-muted-foreground">minutes</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activities Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b bg-muted/30 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Class Activities
                  </CardTitle>
                  <Dialog open={showAddActivityDialog} onOpenChange={setShowAddActivityDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-1 h-7 text-xs bg-transparent">
                        <Plus className="h-3 w-3" />
                        Add Activity
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Activity</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Time</Label>
                            <Input
                              value={newActivity.time}
                              onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                              placeholder="5:00 PM"
                            />
                          </div>
                          <div>
                            <Label>Duration (min)</Label>
                            <Input
                              type="number"
                              value={newActivity.duration}
                              onChange={(e) =>
                                setNewActivity({ ...newActivity, duration: Number.parseInt(e.target.value) })
                              }
                              min={5}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={newActivity.title}
                            onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                            placeholder="e.g., Team Check-in"
                          />
                        </div>
                        <div>
                          <Label>Type</Label>
                          <Select
                            value={newActivity.type}
                            onValueChange={(value: Activity["type"]) => setNewActivity({ ...newActivity, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lecture">Lecture</SelectItem>
                              <SelectItem value="workshop">Workshop</SelectItem>
                              <SelectItem value="meeting">Meeting</SelectItem>
                              <SelectItem value="presentation">Presentation</SelectItem>
                              <SelectItem value="break">Break</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Description (optional)</Label>
                          <Textarea
                            value={newActivity.description}
                            onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                            placeholder="Brief description..."
                            rows={2}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddActivityDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={addActivity}>Add Activity</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!currentSchedule.activities || currentSchedule.activities.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    No activities scheduled. Add activities to build your class agenda.
                  </div>
                ) : (
                  <div className="divide-y">
                    {currentSchedule.activities.map((activity) => (
                      <div key={activity.id} className="p-3 hover:bg-muted/30 group">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="text-sm font-medium text-muted-foreground w-16 pt-0.5">{activity.time}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{activity.title}</span>
                                <Badge variant="outline" className={`text-xs ${activityTypeColors[activity.type]}`}>
                                  {activity.type}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {activity.duration} min
                                </Badge>
                              </div>
                              {activity.description && (
                                <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600"
                            onClick={() => removeActivity(activity.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Assignments Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b bg-muted/30 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Assignments Due
                  </CardTitle>
                  <Dialog open={showAddAssignmentDialog} onOpenChange={setShowAddAssignmentDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-1 h-7 text-xs bg-transparent">
                        <Plus className="h-3 w-3" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Assignment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={newAssignment.title}
                            onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                            placeholder="e.g., Client SOW Draft"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Type</Label>
                            <Select
                              value={newAssignment.type}
                              onValueChange={(value: Assignment["type"]) =>
                                setNewAssignment({ ...newAssignment, type: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="reading">Reading</SelectItem>
                                <SelectItem value="deliverable">Deliverable</SelectItem>
                                <SelectItem value="quiz">Quiz</SelectItem>
                                <SelectItem value="presentation">Presentation</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Due Date</Label>
                            <Input
                              type="date"
                              value={newAssignment.dueDate}
                              onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Description (optional)</Label>
                          <Textarea
                            value={newAssignment.description}
                            onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                            placeholder="Assignment details..."
                            rows={2}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddAssignmentDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={addAssignment}>Add Assignment</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                {!currentSchedule.assignments || currentSchedule.assignments.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground text-sm">No assignments for this week.</div>
                ) : (
                  <div className="space-y-2">
                    {currentSchedule.assignments.map((assignment) => (
                      <div key={assignment.id} className="p-2 rounded-lg border bg-background hover:bg-muted/30 group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{assignment.title}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`text-xs ${assignmentTypeColors[assignment.type]}`}>
                                {assignment.type}
                              </Badge>
                              {assignment.dueDate && (
                                <span className="text-xs text-muted-foreground">
                                  Due: {formatDate(assignment.dueDate)}
                                </span>
                              )}
                            </div>
                            {assignment.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {assignment.description}
                              </p>
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 text-red-500"
                            onClick={() => removeAssignment(assignment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b bg-muted/30 pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Week Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <Textarea
                  value={currentSchedule.notes || ""}
                  onChange={(e) =>
                    setSchedules(
                      schedules.map((s) => (s.id === currentSchedule.id ? { ...s, notes: e.target.value } : s)),
                    )
                  }
                  onBlur={() => updateSchedule({ notes: currentSchedule.notes })}
                  placeholder="Add notes for this week..."
                  rows={4}
                  className="text-sm"
                />
              </CardContent>
            </Card>

            {/* Status Indicator */}
            {saving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                Saving...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
