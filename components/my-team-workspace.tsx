"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Users, MessageSquare, Plus, Pin, Trash2, Calendar, User, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StakeholderContactCard } from "@/components/stakeholder"

interface TeamMember {
  id: string
  full_name: string
  email: string
  role?: string
}

interface TeamNote {
  id: string
  note_text: string
  created_by_name: string
  created_by_user_id: string
  created_at: string
  is_pinned: boolean
  category: string
}

interface MyTeamWorkspaceProps {
  studentId?: string
  studentEmail?: string
  studentName?: string
  clinic?: string
}

export function MyTeamWorkspace({
  studentId: propStudentId,
  studentEmail: propEmail,
  studentName: propName,
  clinic: propClinic,
}: MyTeamWorkspaceProps = {}) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [clientName, setClientName] = useState<string>("")
  const [teamNotes, setTeamNotes] = useState<TeamNote[]>([])
  const [newNote, setNewNote] = useState("")
  const [noteCategory, setNoteCategory] = useState("general")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [studentId, setStudentId] = useState<string>(propStudentId || "")
  const [studentEmail, setStudentEmail] = useState<string>(propEmail || "")
  const [studentName, setStudentName] = useState<string>(propName || "")
  const [clinic, setClinic] = useState<string>(propClinic || "")

  useEffect(() => {
    loadTeamData()
  }, [studentId, studentEmail])

  const loadTeamData = async () => {
    if (!studentId && !studentEmail) {
      console.log("[v0] Cannot load team data: No student ID or email available")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = studentId
        ? `studentId=${encodeURIComponent(studentId)}`
        : `email=${encodeURIComponent(studentEmail)}`
      const response = await fetch(`/api/team-workspace?${params}`)
      const data = await response.json()

      if (data.success) {
        setTeamMembers(data.teamMembers || [])
        setClientName(data.clientName || "")
        setTeamNotes(data.notes || [])
      }
    } catch (error) {
      console.error("[v0] Error loading team data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    try {
      setSubmitting(true)
      const response = await fetch("/api/team-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          email: studentEmail,
          noteText: newNote,
          category: noteCategory,
          createdByName: studentName,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setNewNote("")
        setNoteCategory("general")
        setIsDialogOpen(false)
        await loadTeamData()
      }
    } catch (error) {
      console.error("[v0] Error adding note:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Delete this note?")) return

    try {
      const response = await fetch(`/api/team-workspace?noteId=${noteId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await loadTeamData()
      }
    } catch (error) {
      console.error("[v0] Error deleting note:", error)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "meeting":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "deliverable":
        return "bg-green-100 text-green-700 border-green-300"
      case "question":
        return "bg-amber-100 text-amber-700 border-amber-300"
      default:
        return "bg-slate-100 text-slate-700 border-slate-300"
    }
  }

  if (loading) {
    return (
      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-base">My Team</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-slate-500">Loading team workspace...</p>
        </CardContent>
      </Card>
    )
  }

  if (!studentId && !studentEmail) {
    return (
      <Card className="border-amber-200/60 shadow-sm bg-amber-50/30">
        <CardHeader className="p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base">My Team</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-slate-600">No student profile found. Please log in to view your team workspace.</p>
        </CardContent>
      </Card>
    )
  }

  if (teamMembers.length === 0) {
    return (
      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-base">My Team</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-slate-500">No team assigned yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-indigo-200/60 shadow-sm">
      <CardHeader className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <div>
              <CardTitle className="text-base text-slate-900">My Team</CardTitle>
              <CardDescription className="text-xs text-slate-600 mt-0.5">
                {clientName} • {teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Note</DialogTitle>
                <DialogDescription>Share information with your team members</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Category</label>
                  <Select value={noteCategory} onValueChange={setNoteCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="meeting">Meeting Notes</SelectItem>
                      <SelectItem value="deliverable">Deliverable</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Note</label>
                  <Textarea
                    placeholder="Type your note here..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
                <Button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {submitting ? "Adding..." : "Add Note"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Team Members */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
            <User className="h-4 w-4" />
            Team Members
          </h3>
          <div className="flex flex-wrap gap-2">
            {teamMembers.map((member) => (
              <StakeholderContactCard
                key={member.id}
                type="student"
                id={member.id}
                name={member.full_name}
                subtitle={member.role}
                variant="compact"
              />
            ))}
          </div>
        </div>

        {/* Team Notes */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Shared Notes ({teamNotes.length})
          </h3>
          {teamNotes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-600">No team notes yet</p>
              <p className="text-xs text-slate-500 mt-1">Add notes to share with your team</p>
            </div>
          ) : (
            <div className="space-y-2">
              {teamNotes
                .sort((a, b) => {
                  if (a.is_pinned && !b.is_pinned) return -1
                  if (!a.is_pinned && b.is_pinned) return 1
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                })
                .map((note) => (
                  <div
                    key={note.id}
                    className={`rounded-lg border p-3 ${note.is_pinned ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-[10px] ${getCategoryColor(note.category)}`}>
                            {note.category}
                          </Badge>
                          {note.is_pinned && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-yellow-100 text-yellow-700 border-yellow-300"
                            >
                              <Pin className="h-2.5 w-2.5 mr-0.5" />
                              Pinned
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-900 leading-relaxed">{note.note_text}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {note.created_by_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(note.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      {note.created_by_name === studentName && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
