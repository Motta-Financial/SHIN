"use client"

import { usePathname } from "next/navigation"
import { ShinAssistant } from "./shin-assistant"
import { useEffect, useState } from "react"

export function ShinAssistantWrapper() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [userInfo, setUserInfo] = useState<{
    userType: "director" | "student" | "client"
    userName: string
    userEmail: string
    contextData?: {
      clinicId?: string
      clientId?: string
      studentId?: string
    }
  } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Determine user type and context from pathname
    const detectUserContext = () => {
      if (
        pathname?.startsWith("/director") ||
        pathname?.startsWith("/class-course") ||
        pathname?.startsWith("/my-clinic") ||
        pathname?.startsWith("/client-engagements") ||
        pathname?.startsWith("/prospects")
      ) {
        return {
          userType: "director" as const,
          userName: "Clinic Director",
          userEmail: "",
        }
      } else if (pathname?.startsWith("/students") || pathname?.startsWith("/student-")) {
        return {
          userType: "student" as const,
          userName: "Student",
          userEmail: "",
        }
      } else if (pathname?.startsWith("/client-portal")) {
        return {
          userType: "client" as const,
          userName: "Client",
          userEmail: "",
        }
      }
      // Default to director for admin pages
      return {
        userType: "director" as const,
        userName: "User",
        userEmail: "",
      }
    }

    setUserInfo(detectUserContext())
  }, [pathname])

  if (!mounted) return null

  // Don't show on sign-in or landing pages
  if (!pathname || pathname === "/" || pathname.includes("sign-in") || pathname.includes("sign-up")) {
    return null
  }

  if (!userInfo) return null

  return (
    <ShinAssistant
      userType={userInfo.userType}
      userName={userInfo.userName}
      userEmail={userInfo.userEmail}
      contextData={userInfo.contextData}
    />
  )
}
