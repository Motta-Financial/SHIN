"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import useSWR from "swr"

interface Semester {
  id: string
  semester: string
  is_active: boolean
  start_date: string
  end_date: string
}

interface SemesterContextType {
  semesters: Semester[]
  selectedSemester: Semester | null
  selectedSemesterId: string | null
  setSelectedSemesterId: (id: string) => void
  activeSemester: Semester | null
  isLoading: boolean
  error: Error | null
  refresh: () => void
}

const SemesterContext = createContext<SemesterContextType | null>(null)

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const SEMESTER_STORAGE_KEY = "shin_selected_semester_id"

export function SemesterProvider({ children }: { children: ReactNode }) {
  const { data, error, isLoading, mutate } = useSWR<{ semesters: Semester[] }>("/api/semester-config", fetcher)

  const [selectedSemesterId, setSelectedSemesterIdState] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const semesters = data?.semesters || []
  const activeSemester = semesters.find((s) => s.is_active) || semesters[0] || null

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(SEMESTER_STORAGE_KEY)
    if (stored) {
      setSelectedSemesterIdState(stored)
    }
  }, [])

  // Default to active semester if none selected
  useEffect(() => {
    if (mounted && semesters.length > 0 && !selectedSemesterId) {
      const defaultId = activeSemester?.id || semesters[0]?.id
      if (defaultId) {
        setSelectedSemesterIdState(defaultId)
        localStorage.setItem(SEMESTER_STORAGE_KEY, defaultId)
      }
    }
  }, [mounted, semesters, selectedSemesterId, activeSemester])

  const setSelectedSemesterId = (id: string) => {
    setSelectedSemesterIdState(id)
    localStorage.setItem(SEMESTER_STORAGE_KEY, id)
    // Trigger a refresh of all SWR data by mutating the semester config
    mutate()
  }

  const selectedSemester = semesters.find((s) => s.id === selectedSemesterId) || activeSemester

  return (
    <SemesterContext.Provider
      value={{
        semesters,
        selectedSemester,
        selectedSemesterId,
        setSelectedSemesterId,
        activeSemester,
        isLoading,
        error,
        refresh: mutate,
      }}
    >
      {children}
    </SemesterContext.Provider>
  )
}

export function useGlobalSemester() {
  const context = useContext(SemesterContext)
  if (!context) {
    throw new Error("useGlobalSemester must be used within a SemesterProvider")
  }
  return context
}
