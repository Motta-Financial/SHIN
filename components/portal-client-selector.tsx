"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase } from "lucide-react"

interface Client {
  id: string
  name: string
}

interface PortalClientSelectorProps {
  selectedClientId: string
  onClientChange: (clientId: string) => void
  className?: string
  // Optional: filter clients by student assignment
  studentId?: string
}

export function PortalClientSelector({
  selectedClientId,
  onClientChange,
  className,
  studentId,
}: PortalClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        // If studentId is provided, get only clients assigned to that student
        const url = studentId ? `/api/supabase/v-complete-mapping?studentId=${studentId}` : "/api/clients"

        const res = await fetch(url)
        const data = await res.json()

        if (studentId && data.data) {
          // Extract unique clients from v_complete_mapping
          const clientMap = new Map<string, string>()
          data.data.forEach((m: any) => {
            if (m.client_id && m.client_name) {
              clientMap.set(m.client_id, m.client_name)
            }
          })
          const clientList = Array.from(clientMap.entries()).map(([id, name]) => ({
            id,
            name,
          }))
          setClients(clientList)
          if (!selectedClientId && clientList.length > 0) {
            onClientChange(clientList[0].id)
          }
        } else if (data.clients) {
          setClients(
            data.clients.map((c: any) => ({
              id: c.id,
              name: c.name,
            })),
          )
          if (!selectedClientId && data.clients.length > 0) {
            onClientChange(data.clients[0].id)
          }
        }
      } catch (error) {
        console.error("Error fetching clients:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchClients()
  }, [studentId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Briefcase className="h-4 w-4" />
        Loading clients...
      </div>
    )
  }

  return (
    <div className={className}>
      <Select value={selectedClientId} onValueChange={onClientChange}>
        <SelectTrigger className="w-[280px] bg-white">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Select a client to view" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
