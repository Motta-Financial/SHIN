"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Plus, Edit2, Trash2, ChevronUp, ChevronDown, Save, X } from "lucide-react"

interface ClientAgendaItem {
  id: string
  client_name: string
  week_ending: string
  clinic?: string
  notes?: string
  order_index: number
}

interface AgendaWidgetProps {
  selectedClinic: string
  selectedWeeks: string[]
}

export function AgendaWidget({ selectedClinic, selectedWeeks }: AgendaWidgetProps) {
  const [items, setItems] = useState<ClientAgendaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState("")
  const [newClient, setNewClient] = useState({
    client_name: "",
    notes: "",
  })

  const primaryWeek = selectedWeeks.length > 0 ? selectedWeeks.sort((a, b) => b.localeCompare(a))[0] : ""

  useEffect(() => {
    fetchAgendaItems()
  }, [selectedClinic, selectedWeeks])

  const fetchAgendaItems = async () => {
    if (!primaryWeek) {
      setItems([])
      setLoading(false)
      return
    }
    try {
      const response = await fetch(`/api/weekly-client-agenda?weekEnding=${primaryWeek}&clinic=${selectedClinic}`)
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error("[v0] Error fetching client agenda:", error)
    } finally {
      setLoading(false)
    }
  }

  const addClient = async () => {
    if (!newClient.client_name || !primaryWeek) return

    try {
      const response = await fetch("/api/weekly-client-agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: newClient.client_name,
          week_ending: primaryWeek,
          clinic: selectedClinic === "all" ? null : selectedClinic,
          notes: newClient.notes,
          order_index: items.length,
        }),
      })
      const data = await response.json()
      setItems([...items, data.item])
      setShowAddDialog(false)
      setNewClient({ client_name: "", notes: "" })
    } catch (error) {
      console.error("[v0] Error adding client:", error)
    }
  }

  const updateNotes = async (item: ClientAgendaItem) => {
    try {
      await fetch("/api/weekly-client-agenda", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, notes: editNotes }),
      })
      setItems(items.map((i) => (i.id === item.id ? { ...i, notes: editNotes } : i)))
      setEditingId(null)
      setEditNotes("")
    } catch (error) {
      console.error("[v0] Error updating notes:", error)
    }
  }

  const deleteClient = async (id: string) => {
    try {
      await fetch(`/api/weekly-client-agenda?id=${id}`, { method: "DELETE" })
      setItems(items.filter((i) => i.id !== id))
    } catch (error) {
      console.error("[v0] Error deleting client:", error)
    }
  }

  const moveClient = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= items.length) return

    const newItems = [...items]
    const [movedItem] = newItems.splice(index, 1)
    newItems.splice(newIndex, 0, movedItem)

    // Update order_index for all affected items
    const updates = newItems.map((item, idx) => ({
      id: item.id,
      order_index: idx,
    }))

    setItems(newItems)

    // Update in database
    try {
      await Promise.all(
        updates.map((update) =>
          fetch("/api/weekly-client-agenda", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(update),
          }),
        ),
      )
    } catch (error) {
      console.error("[v0] Error reordering clients:", error)
    }
  }

  const startEdit = (item: ClientAgendaItem) => {
    setEditingId(item.id)
    setEditNotes(item.notes || "")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditNotes("")
  }

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#0077B6]" />
            Weekly Client Agenda
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-6 text-xs bg-[#0077B6] hover:bg-[#005a8c]">
                <Plus className="h-3 w-3 mr-1" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Client to Agenda</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Client Name</label>
                  <Input
                    value={newClient.client_name}
                    onChange={(e) => setNewClient({ ...newClient, client_name: e.target.value })}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Notes / Comments</label>
                  <Textarea
                    value={newClient.notes}
                    onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                    placeholder="Add notes or comments about this client..."
                    rows={3}
                  />
                </div>
                <Button onClick={addClient} className="w-full bg-[#0077B6] hover:bg-[#005a8c]">
                  Add to Agenda
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 pb-3">
        {loading ? (
          <p className="text-xs text-gray-500 text-center py-2">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-2">No clients in agenda for this week</p>
        ) : (
          items.map((item, index) => (
            <div key={item.id} className="p-2 rounded-lg border bg-white hover:shadow-sm transition-all">
              <div className="flex items-start gap-2">
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <button
                    onClick={() => moveClient(index, "up")}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-[#0077B6] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => moveClient(index, "down")}
                    disabled={index === items.length - 1}
                    className="text-gray-400 hover:text-[#0077B6] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{item.client_name}</p>
                    <div className="flex items-center gap-1">
                      {editingId === item.id ? (
                        <>
                          <button
                            onClick={() => updateNotes(item)}
                            className="text-green-600 hover:text-green-700 transition-colors"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(item)}
                            className="text-gray-400 hover:text-[#0077B6] transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteClient(item.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {editingId === item.id ? (
                    <Textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Add notes or comments..."
                      rows={2}
                      className="mt-1.5 text-xs"
                    />
                  ) : item.notes ? (
                    <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{item.notes}</p>
                  ) : (
                    <p className="text-xs text-gray-400 italic mt-1">No notes added</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
