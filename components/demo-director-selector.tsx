"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building2 } from "lucide-react"
import { useDirectors } from "@/hooks/use-directors"

interface Director {
  id: string
  full_name: string
  clinic: string
  clinic_id?: string
  email: string
}

const STORAGE_KEY = "selectedDirectorId"

// Default director ID - will use first available if not set
const DEFAULT_DIRECTOR_ID = ""

// Helper to get stored value synchronously
function getStoredDirectorId(): string {
  if (typeof window === "undefined") return DEFAULT_DIRECTOR_ID
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_DIRECTOR_ID
}

// Helper to set stored value and notify listeners
function setStoredDirectorId(id: string) {
  localStorage.setItem(STORAGE_KEY, id)
  // Dispatch custom event for same-window listeners
  window.dispatchEvent(new CustomEvent("demoDirectorChanged", { detail: { directorId: id } }))
  // Force page reload to ensure all components pick up the change
  window.location.reload()
}

interface DemoDirectorSelectorProps {
  onDirectorChange?: (directorId: string) => void
  className?: string
}

export function DemoDirectorSelector({ onDirectorChange, className }: DemoDirectorSelectorProps) {
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_DIRECTOR_ID)
  const [mounted, setMounted] = useState(false)
  const { directors, isLoading } = useDirectors()

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setSelectedId(stored)
    }
  }, [])

  // Set default to first director if none selected
  useEffect(() => {
    if (mounted && directors.length > 0 && !selectedId) {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        // Don't auto-select, let user choose
      } else if (!directors.find((d) => d.id === stored)) {
        // Stored ID doesn't exist anymore, clear it
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [mounted, directors, selectedId])

  const handleChange = (newId: string) => {
    setSelectedId(newId)
    onDirectorChange?.(newId)
    // This will reload the page to ensure sync
    setStoredDirectorId(newId)
  }

  const selectedDirector = directors.find((d) => d.id === selectedId)

  if (!mounted) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
          <Building2 className="h-3 w-3 mr-1" />
          Demo Mode
        </Badge>
        <div className="w-[220px] h-8 bg-slate-100 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
        <Building2 className="h-3 w-3 mr-1" />
        Demo Mode
      </Badge>
      <Select value={selectedId} onValueChange={handleChange}>
        <SelectTrigger className="w-[250px] h-8 text-sm bg-white/10 border-white/20 text-white">
          <SelectValue placeholder={isLoading ? "Loading..." : "Select director"}>
            {selectedDirector ? `${selectedDirector.full_name}` : "Select director"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {directors.map((director) => (
            <SelectItem key={director.id} value={director.id}>
              <div className="flex flex-col">
                <span className="font-medium">{director.full_name}</span>
                <span className="text-xs text-muted-foreground">{director.clinic}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function useDemoDirector(): { directorId: string; isReady: boolean } {
  const [directorId, setDirectorId] = useState<string>(DEFAULT_DIRECTOR_ID)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Get stored value on mount
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setDirectorId(stored)
    }
    setIsReady(true)
  }, [])

  return { directorId, isReady }
}

export { STORAGE_KEY as DIRECTOR_STORAGE_KEY, DEFAULT_DIRECTOR_ID, getStoredDirectorId, setStoredDirectorId }
