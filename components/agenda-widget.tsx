"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Plus, User } from "lucide-react"

const CLIENT_AGENDA = [
  { name: "Serene Cycle", director: "Beth DiRusso" },
  { name: "Intriguing Hair", director: "Beth DiRusso & Nick Vadala" },
  { name: "The Downtown Paw", director: "Chris Hill" },
  { name: "REWRITE", director: "Chris Hill" },
  { name: "Marabou Café", director: "Ken Mooney" },
  { name: "SEED", director: "Ken Mooney" },
  { name: "Crown Legends", director: "Mark Dwyer" },
  { name: "Sawyer Parks", director: "Nick Vadala" },
  { name: "City of Malden", director: "Nick Vadala" },
  { name: "Future Masters of Chess Academy", director: "Beth DiRusso & Nick Vadala" },
  { name: "Muffy White", director: "Mark Dwyer" },
]

const DIRECTOR_COLORS: Record<string, string> = {
  "Beth DiRusso": "bg-blue-100 text-blue-700 border-blue-200",
  "Beth DiRusso & Nick Vadala": "bg-purple-100 text-purple-700 border-purple-200",
  "Chris Hill": "bg-green-100 text-green-700 border-green-200",
  "Ken Mooney": "bg-orange-100 text-orange-700 border-orange-200",
  "Mark Dwyer": "bg-pink-100 text-pink-700 border-pink-200",
  "Nick Vadala": "bg-cyan-100 text-cyan-700 border-cyan-200",
}

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
  selectedWeek: string
}

export function AgendaWidget({ selectedClinic, selectedWeek }: AgendaWidgetProps) {
  const [items, setItems] = useState<ClientAgendaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState("")
  const [newClient, setNewClient] = useState({
    client_name: "",
    notes: "",
  })

  useEffect(() => {
    fetchAgendaItems()
  }, [selectedClinic, selectedWeek])

  const fetchAgendaItems = async () => {
    try {
      const response = await fetch(`/api/weekly-client-agenda?weekEnding=${selectedWeek}&clinic=${selectedClinic}`)
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error("[v0] Error fetching client agenda:", error)
    } finally {
      setLoading(false)
    }
  }

  const addClient = async () => {
    if (!newClient.client_name) return

    try {
      const response = await fetch("/api/weekly-client-agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: newClient.client_name,
          week_ending: selectedWeek,
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

  console.log("[v0] AgendaWidget - Rendering with CLIENT_AGENDA:", CLIENT_AGENDA.length, "clients")

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
      <CardContent className="space-y-1 pb-3">
        <div className="space-y-2">
          {CLIENT_AGENDA.map((client, index) => (
            <div
              key={client.name}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#0077B6] hover:shadow-sm transition-all bg-white"
            >
              <span className="text-sm font-bold text-[#0077B6] w-6 flex-shrink-0 mt-0.5">{index + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 mb-1.5">{client.name}</div>
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      DIRECTOR_COLORS[client.director] || "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    {client.director}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
