"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Plus,
  Trash2,
  Clock,
  ChevronDown,
  ChevronRight,
  Video,
  MapPin,
  Pencil,
  Save,
  Loader2,
  BookOpen,
  AlertCircle,
} from "lucide-react"
import { useUserRole } from "@/hooks/use-user-role"
import { createClient } from "@/utils/supabase/client"

interface AgendaItem {
  id: string
  title: string
  duration: number
  description?: string
  presenter?: string
}

interface ClinicAgenda {
  id: string
  clinic_id: string
  director_id: string
  week_number: number
  semester_id: string
  title: string
  description?: string
  agenda_items: AgendaItem[]
  start_time?: string
  end_time?: string
  room_assignment?: string
  zoom_link?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface DirectorInfo {
  id: string
  full_name: string
  clinic_id: string
  clinic_name: string
}

interface ClinicAgendaTabProps {
  clinicId?: string
  clinicName?: string
  directorId?: string
  directorName?: string
  semesterId?: string
}

const SPRING_2026_SEMESTER_ID = "a1b2c3d4-e5f6-7890-abcd-202601120000"

export function ClinicAgendaTab({
  clinicId: propClinicId,
  clinicName: propClinicName,
  directorId: propDirectorId,
  directorName: propDirectorName,
  semesterId = SPRING_2026_SEMESTER_ID,
}: ClinicAgendaTabProps) {
  const { email, isLoading: userLoading } = useUserRole()
  const [directorInfo, setDirectorInfo] = useState<DirectorInfo | null>(null)
  const [loadingDirector, setLoadingDirector] = useState(true)

  // Use props if provided, otherwise use fetched director info
  const clinicId = propClinicId || directorInfo?.clinic_id
  const clinicName = propClinicName || directorInfo?.clinic_name || ""
  const directorId = propDirectorId || directorInfo?.id
  const directorName = propDirectorName || directorInfo?.full_name || ""

  const [agendas, setAgendas] = useState<ClinicAgenda[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([1]))
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingAgenda, setEditingAgenda] = useState<ClinicAgenda | null>(null)

  const [newAgenda, setNewAgenda] = useState({
    week_number: 1,
    title: "",
    description: "",
    start_time: "5:15 PM",
    end_time: "6:00 PM",
    room_assignment: "",
    zoom_link: "",
    notes: "",
    agenda_items: [] as AgendaItem[],
  })

  const [newAgendaItem, setNewAgendaItem] = useState({
    title: "",
    duration: 15,
    description: "",
    presenter: "",
  })

  useEffect(() => {
    const fetchDirectorInfo = async () => {
      // If props are provided, use them directly
      if (propClinicId && propDirectorId) {
        setLoadingDirector(false)
        return
      }

      if (!email || userLoading) return

      setLoadingDirector(true)
      try {
        const supabase = createClient()

        const { data: directors, error: directorError } = await supabase
          .from("directors")
          .select("id, full_name, clinic_id")
          .eq("email", email)
          .limit(1)

        if (directorError) {
          console.error("Error fetching director:", directorError)
          setLoadingDirector(false)
          return
        }

        const director = directors?.[0]
        if (!director) {
          console.log("[v0] No director found for email:", email)
          setLoadingDirector(false)
          return
        }

        // Then get clinic name
        const { data: clinics, error: clinicError } = await supabase
          .from("clinics")
          .select("id, name")
          .eq("id", director.clinic_id)
          .limit(1)

        if (clinicError) {
          console.error("Error fetching clinic:", clinicError)
        }

        const clinic = clinics?.[0]

        setDirectorInfo({
          id: director.id,
          full_name: director.full_name,
          clinic_id: director.clinic_id,
          clinic_name: clinic?.name || "",
        })
      } catch (error) {
        console.error("Error fetching director info:", error)
      } finally {
        setLoadingDirector(false)
      }
    }

    fetchDirectorInfo()
  }, [email, userLoading, propClinicId, propDirectorId])

  useEffect(() => {
    if (clinicId && !loadingDirector) {
      fetchAgendas()
    }
  }, [clinicId, semesterId, loadingDirector])

  const fetchAgendas = async () => {
    if (!clinicId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/clinic-agendas?clinicId=${clinicId}&semesterId=${semesterId}`)
      if (res.ok) {
        const data = await res.json()
        setAgendas(data.agendas || [])
      }
    } catch (error) {
      console.error("Error fetching clinic agendas:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAgenda = async () => {
    if (!clinicId || !directorId) return

    setSaving(true)
    try {
      const res = await fetch("/api/clinic-agendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_id: clinicId,
          director_id: directorId,
          semester_id: semesterId,
          ...newAgenda,
        }),
      })

      if (res.ok) {
        await fetchAgendas()
        setShowAddDialog(false)
        resetNewAgenda()
      }
    } catch (error) {
      console.error("Error saving agenda:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateAgenda = async (agenda: ClinicAgenda) => {
    setSaving(true)
    try {
      const res = await fetch("/api/clinic-agendas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agenda),
      })

      if (res.ok) {
        await fetchAgendas()
        setEditingAgenda(null)
      }
    } catch (error) {
      console.error("Error updating agenda:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAgenda = async (agendaId: string) => {
    if (!confirm("Are you sure you want to delete this agenda?")) return

    try {
      const res = await fetch(`/api/clinic-agendas?id=${agendaId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        await fetchAgendas()
      }
    } catch (error) {
      console.error("Error deleting agenda:", error)
    }
  }

  const resetNewAgenda = () => {
    setNewAgenda({
      week_number: 1,
      title: "",
      description: "",
      start_time: "5:15 PM",
      end_time: "6:00 PM",
      room_assignment: "",
      zoom_link: "",
      notes: "",
      agenda_items: [],
    })
  }

  const addAgendaItem = () => {
    if (!newAgendaItem.title) return
    setNewAgenda((prev) => ({
      ...prev,
      agenda_items: [...prev.agenda_items, { ...newAgendaItem, id: crypto.randomUUID() }],
    }))
    setNewAgendaItem({ title: "", duration: 15, description: "", presenter: "" })
  }

  const removeAgendaItem = (itemId: string) => {
    setNewAgenda((prev) => ({
      ...prev,
      agenda_items: prev.agenda_items.filter((item) => item.id !== itemId),
    }))
  }

  const toggleWeek = (weekNumber: number) => {
    setOpenWeeks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(weekNumber)) {
        newSet.delete(weekNumber)
      } else {
        newSet.add(weekNumber)
      }
      return newSet
    })
  }

  const getWeeksWithAgendas = () => {
    const weeks: number[] = []
    for (let i = 1; i <= 17; i++) {
      weeks.push(i)
    }
    return weeks
  }

  const getAgendasForWeek = (weekNumber: number) => {
    return agendas.filter((a) => a.week_number === weekNumber)
  }

  if (userLoading || loadingDirector) {
    return (
      <Card className="border-[#3C507D]/20">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#3C507D]" />
          <span className="ml-2 text-[#3C507D]">Loading clinic information...</span>
        </CardContent>
      </Card>
    )
  }

  if (!clinicId || !directorId) {
    return (
      <Card className="border-[#3C507D]/20">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            <p>Unable to load clinic agenda. Director information not found for this account.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="border-[#3C507D]/20">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#3C507D]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[#3C507D]/20">
      <CardHeader className="bg-gradient-to-r from-[#112250] to-[#3C507D] text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6" />
            <div>
              <CardTitle className="text-lg">{clinicName} Clinic Agenda</CardTitle>
              <p className="text-sm text-[#F5F0E9]/80">Managed by {directorName}</p>
            </div>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Agenda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Clinic Lecture Agenda</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Week Number</Label>
                    <Select
                      value={String(newAgenda.week_number)}
                      onValueChange={(v) => setNewAgenda((prev) => ({ ...prev, week_number: Number.parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 17 }, (_, i) => i + 1).map((week) => (
                          <SelectItem key={week} value={String(week)}>
                            Week {week}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={newAgenda.title}
                      onChange={(e) => setNewAgenda((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Marketing Strategy Deep Dive"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newAgenda.description}
                    onChange={(e) => setNewAgenda((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the lecture topic..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      value={newAgenda.start_time}
                      onChange={(e) => setNewAgenda((prev) => ({ ...prev, start_time: e.target.value }))}
                      placeholder="5:15 PM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      value={newAgenda.end_time}
                      onChange={(e) => setNewAgenda((prev) => ({ ...prev, end_time: e.target.value }))}
                      placeholder="6:00 PM"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Room Assignment</Label>
                    <Input
                      value={newAgenda.room_assignment}
                      onChange={(e) => setNewAgenda((prev) => ({ ...prev, room_assignment: e.target.value }))}
                      placeholder="e.g., Room 301"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Zoom Link</Label>
                    <Input
                      value={newAgenda.zoom_link}
                      onChange={(e) => setNewAgenda((prev) => ({ ...prev, zoom_link: e.target.value }))}
                      placeholder="https://zoom.us/..."
                    />
                  </div>
                </div>

                {/* Agenda Items Section */}
                <div className="border rounded-lg p-4 space-y-4">
                  <Label className="text-base font-semibold">Agenda Items</Label>

                  {newAgenda.agenda_items.length > 0 && (
                    <div className="space-y-2">
                      {newAgenda.agenda_items.map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{index + 1}.</span>
                            <span className="text-sm">{item.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.duration} min
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeAgendaItem(item.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-2">
                      <Input
                        value={newAgendaItem.title}
                        onChange={(e) => setNewAgendaItem((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Agenda item title"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        value={newAgendaItem.duration}
                        onChange={(e) =>
                          setNewAgendaItem((prev) => ({
                            ...prev,
                            duration: Number.parseInt(e.target.value) || 15,
                          }))
                        }
                        placeholder="Minutes"
                      />
                    </div>
                    <Button onClick={addAgendaItem} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={newAgenda.notes}
                    onChange={(e) => setNewAgenda((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes for this lecture..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveAgenda} disabled={saving || !newAgenda.title}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Agenda
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        {getWeeksWithAgendas().map((weekNumber) => {
          const weekAgendas = getAgendasForWeek(weekNumber)
          const isOpen = openWeeks.has(weekNumber)

          return (
            <Collapsible key={weekNumber} open={isOpen} onOpenChange={() => toggleWeek(weekNumber)}>
              <CollapsibleTrigger asChild>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    weekAgendas.length > 0
                      ? "bg-[#E0C58F]/20 hover:bg-[#E0C58F]/30 border border-[#E0C58F]/40"
                      : "bg-muted/50 hover:bg-muted border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-[#3C507D]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#3C507D]" />
                    )}
                    <span className="font-medium">Week {weekNumber}</span>
                    {weekAgendas.length > 0 && (
                      <Badge className="bg-[#3C507D] text-white">
                        {weekAgendas.length} agenda{weekAgendas.length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {weekAgendas.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No agenda items for this week yet
                  </div>
                ) : (
                  weekAgendas.map((agenda) => (
                    <div key={agenda.id} className="ml-6 p-4 border rounded-lg bg-white shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-[#112250]">{agenda.title}</h4>
                          </div>
                          {agenda.description && <p className="text-sm text-muted-foreground">{agenda.description}</p>}
                          <div className="flex flex-wrap gap-3 text-sm">
                            {agenda.start_time && agenda.end_time && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {agenda.start_time} - {agenda.end_time}
                              </div>
                            )}
                            {agenda.room_assignment && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                {agenda.room_assignment}
                              </div>
                            )}
                            {agenda.zoom_link && (
                              <a
                                href={agenda.zoom_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:underline"
                              >
                                <Video className="h-4 w-4" />
                                Join Zoom
                              </a>
                            )}
                          </div>
                          {agenda.agenda_items && agenda.agenda_items.length > 0 && (
                            <div className="mt-3 space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase">Agenda Items</p>
                              {agenda.agenda_items.map((item, idx) => (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-2 text-sm pl-2 border-l-2 border-[#E0C58F]"
                                >
                                  <span className="text-muted-foreground">{idx + 1}.</span>
                                  <span>{item.title}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {item.duration}m
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditingAgenda(agenda)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteAgenda(agenda.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </CardContent>
    </Card>
  )
}
