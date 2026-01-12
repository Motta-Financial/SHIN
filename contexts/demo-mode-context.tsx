"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface DemoModeContextValue {
  isDemoMode: boolean
  setDemoMode: (enabled: boolean) => void
  isReady: boolean
}

const DemoModeContext = createContext<DemoModeContextValue | undefined>(undefined)

const DEMO_MODE_STORAGE_KEY = "demoModeEnabled"

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Load demo mode preference from localStorage
    const stored = localStorage.getItem(DEMO_MODE_STORAGE_KEY)
    // Default to false (live mode) for launch
    setIsDemoMode(stored === "true")
    setIsReady(true)
  }, [])

  const setDemoMode = (enabled: boolean) => {
    setIsDemoMode(enabled)
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, String(enabled))
    // Reload to apply changes across the app
    window.location.reload()
  }

  return <DemoModeContext.Provider value={{ isDemoMode, setDemoMode, isReady }}>{children}</DemoModeContext.Provider>
}

export function useDemoMode() {
  const context = useContext(DemoModeContext)
  if (context === undefined) {
    throw new Error("useDemoMode must be used within a DemoModeProvider")
  }
  return context
}

export { DEMO_MODE_STORAGE_KEY }
