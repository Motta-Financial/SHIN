"use client"

import { useState, useEffect } from "react"
import { DEFAULT_DIRECTOR_ID, getStoredDirectorId } from "@/components/demo-director-selector"

interface Director {
  id: string
  full_name: string
  email: string
  clinic_name?: string
}

// Director data - matches the DEMO_DIRECTORS in the selector
const DEMO_DIRECTORS: { id: string; name: string; email: string; clinic: string }[] = [
  { id: "dir-001", name: "Mark Dwyer", email: "mark.dwyer@suffolk.edu", clinic: "Accounting" },
  { id: "dir-002", name: "Christopher Hill", email: "christopher.hill@suffolk.edu", clinic: "Marketing" },
  { id: "dir-003", name: "Nick Vadala", email: "nvadala@suffolk.edu", clinic: "Consulting" },
  { id: "dir-004", name: "Darrell Mottley", email: "darrell.mottley@suffolk.edu", clinic: "Legal" },
  { id: "dir-005", name: "Ken Mooney", email: "kmooney@suffolk.edu", clinic: "Resource Acquisition" },
]

export function useDemoDirector(): { director: Director | null; directorId: string; isReady: boolean } {
  const [directorId, setDirectorId] = useState<string>(DEFAULT_DIRECTOR_ID)
  const [director, setDirector] = useState<Director | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Get stored value on mount
    const storedId = getStoredDirectorId()
    setDirectorId(storedId)

    // Find the director
    const foundDirector = DEMO_DIRECTORS.find((d) => d.id === storedId)
    if (foundDirector) {
      setDirector({
        id: foundDirector.id,
        full_name: foundDirector.name,
        email: foundDirector.email,
        clinic_name: foundDirector.clinic,
      })
    }

    setIsReady(true)
  }, [])

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newId = getStoredDirectorId()
      setDirectorId(newId)

      const foundDirector = DEMO_DIRECTORS.find((d) => d.id === newId)
      if (foundDirector) {
        setDirector({
          id: foundDirector.id,
          full_name: foundDirector.name,
          email: foundDirector.email,
          clinic_name: foundDirector.clinic,
        })
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  return { director, directorId, isReady }
}
