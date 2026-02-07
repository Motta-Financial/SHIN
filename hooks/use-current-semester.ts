"use client"

import { useState, useEffect } from "react"
import { fetchWithRateLimit } from "@/lib/fetch-with-rate-limit"

// Fallback values
const FALLBACK_SEMESTER_ID = "a1b2c3d4-e5f6-7890-abcd-202601120000"
const FALLBACK_SEMESTER_NAME = "Spring 2026"

interface CurrentSemester {
  semesterId: string
  semesterName: string
  isLoading: boolean
}

// Module-level cache to avoid refetching
let cachedSemesterId: string | null = null
let cachedSemesterName: string | null = null
let fetchPromise: Promise<void> | null = null

/**
 * Hook to get the current semester ID and name
 * Caches the result to avoid repeated API calls
 */
export function useCurrentSemester(): CurrentSemester {
  const [semesterId, setSemesterId] = useState<string>(cachedSemesterId || FALLBACK_SEMESTER_ID)
  const [semesterName, setSemesterName] = useState<string>(cachedSemesterName || FALLBACK_SEMESTER_NAME)
  const [isLoading, setIsLoading] = useState(!cachedSemesterId)

  useEffect(() => {
    // If already cached, use cached values
    if (cachedSemesterId && cachedSemesterName) {
      setSemesterId(cachedSemesterId)
      setSemesterName(cachedSemesterName)
      setIsLoading(false)
      return
    }

    // If a fetch is already in progress, wait for it
    if (fetchPromise) {
      fetchPromise.then(() => {
        if (cachedSemesterId && cachedSemesterName) {
          setSemesterId(cachedSemesterId)
          setSemesterName(cachedSemesterName)
        }
        setIsLoading(false)
      })
      return
    }

    // Start fetching
    fetchPromise = (async () => {
      try {
        const res = await fetchWithRateLimit("/api/current-semester")
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            cachedSemesterId = data.semesterId
            cachedSemesterName = data.semesterName
            setSemesterId(data.semesterId)
            setSemesterName(data.semesterName)
          }
        }
      } catch (error) {
        console.error("[useCurrentSemester] Error fetching semester:", error)
      } finally {
        setIsLoading(false)
        fetchPromise = null
      }
    })()
  }, [])

  return { semesterId, semesterName, isLoading }
}

/**
 * Get the current semester ID synchronously (returns fallback if not cached)
 * Useful for initial values before the hook loads
 */
export function getCurrentSemesterIdSync(): string {
  return cachedSemesterId || FALLBACK_SEMESTER_ID
}
