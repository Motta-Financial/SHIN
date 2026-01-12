"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"

interface Semester {
  id: string
  semester: string
  is_active: boolean
  start_date: string
  end_date: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useSemester() {
  const { data, error, isLoading, mutate } = useSWR<{ semesters: Semester[] }>("/api/semester-config", fetcher)

  const semesters = data?.semesters || []
  const activeSemester = semesters.find((s) => s.is_active) || semesters[0]
  const inactiveSemesters = semesters.filter((s) => !s.is_active)

  return {
    semesters,
    activeSemester,
    inactiveSemesters,
    isLoading,
    error,
    refresh: mutate,
  }
}

// Hook for archived page - allows selecting any semester
export function useArchivedSemester() {
  const { semesters, activeSemester, isLoading, error } = useSemester()
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null)

  // Default to the first inactive (archived) semester, or fall back to active
  useEffect(() => {
    if (semesters.length > 0 && !selectedSemesterId) {
      const archived = semesters.find((s) => !s.is_active)
      setSelectedSemesterId(archived?.id || semesters[0]?.id)
    }
  }, [semesters, selectedSemesterId])

  const selectedSemester = semesters.find((s) => s.id === selectedSemesterId) || semesters[0]

  return {
    semesters,
    selectedSemester,
    selectedSemesterId,
    setSelectedSemesterId,
    activeSemester,
    isLoading,
    error,
  }
}
