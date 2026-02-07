"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Building2, GraduationCap, Briefcase, LogOut, User, LogIn, CalendarDays } from "lucide-react"
import { AdvancedSearch } from "@/components/advanced-search"
import { useUserRole, getAllowedPortals, clearAuthCache } from "@/hooks/use-user-role"
import { useDemoMode } from "@/contexts/demo-mode-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export function GlobalHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { role, email, fullName, isLoading, isAuthenticated } = useUserRole()
  const { isDemoMode, isReady: isDemoReady } = useDemoMode()
  const [currentDate, setCurrentDate] = useState<string>("")

  useEffect(() => {
    const now = new Date()
    const formatted = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    setCurrentDate(formatted)
  }, [])

  const isDirectorRoute =
    pathname === "/director" ||
    pathname === "/" ||
    pathname.startsWith("/client-engagements") ||
    pathname.startsWith("/student-progress") ||
    pathname.startsWith("/documents") ||
    pathname.startsWith("/prospects") ||
    pathname.startsWith("/roster") ||
    pathname.startsWith("/archived") ||
    pathname.startsWith("/class-course") ||
    pathname.startsWith("/my-clinic") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/debriefs") ||
    pathname.startsWith("/settings")

  const isClientRoute = pathname.startsWith("/client-portal")
  const isStudentRoute =
    pathname.startsWith("/students") ||
    pathname.startsWith("/my-team") ||
    pathname.startsWith("/student-class-course") ||
    pathname.startsWith("/student-hours")

  const allPortalTabs = [
    { name: "Director", href: "/director", icon: Building2, portal: "director" as const },
    { name: "Student", href: "/students", icon: GraduationCap, portal: "student" as const },
    { name: "Client", href: "/client-portal", icon: Briefcase, portal: "client" as const },
  ]

  const showAllPortals = isDemoMode || role === "admin" || role === "director"
  const allowedPortals = showAllPortals ? ["director", "student", "client"] : getAllowedPortals(role)
  const portalTabs = allPortalTabs.filter((tab) => allowedPortals.includes(tab.portal))

  const handleSignOut = async () => {
    clearAuthCache()
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/sign-in")
  }

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : email?.[0]?.toUpperCase() || "U"

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b z-50 flex items-center px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mr-6">
        <img src="/images/shin.png" alt="SHIN Logo" width={32} height={32} className="object-contain" />
        <span className="font-semibold text-lg hidden sm:inline">SHIN</span>
      </Link>

      {(isAuthenticated || isDemoMode) && portalTabs.length > 0 && (
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {portalTabs.map((tab) => {
            const isActive =
              (tab.name === "Director" && isDirectorRoute) ||
              (tab.name === "Student" && isStudentRoute) ||
              (tab.name === "Client" && isClientRoute)

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden md:inline">{tab.name}</span>
              </Link>
            )
          })}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      <div className="flex items-center gap-4">
        {currentDate && (
          <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>{currentDate}</span>
          </div>
        )}

        <AdvancedSearch />

        {!isAuthenticated && !isLoading && !isDemoMode && (
          <Button asChild variant="outline" size="sm">
            <Link href="/sign-in">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Link>
          </Button>
        )}

        {/* User Menu - show when authenticated */}
        {isAuthenticated && !isLoading && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{fullName || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{email}</p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">Role: {role || "Unknown"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/account" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Account Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
