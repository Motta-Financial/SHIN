"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  FileText,
  UserSearch,
  ClipboardList,
  Archive,
  BookOpen,
  UsersRound,
  Briefcase,
  Building2,

  User,
  MessageSquare,
  MessageSquareText,
} from "lucide-react"
import { useUserRole } from "@/hooks/use-user-role"

export function MainNavigation() {
  return (
    <Suspense fallback={<MainNavigationFallback />}>
      <MainNavigationInner />
    </Suspense>
  )
}

function MainNavigationFallback() {
  return (
    <div className="flex flex-col h-full bg-[#112250] shadow-xl border-r border-[#0d1a3d]">
      <div className="p-4 border-b border-[#1a2d52] bg-[#152244]/50">
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#1a2d52] animate-pulse" />
          <div className="h-4 w-16 rounded bg-[#1a2d52] animate-pulse" />
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#1a2d52] animate-pulse" />
              <div className="h-4 w-20 rounded bg-[#1a2d52] animate-pulse" />
            </div>
          ))}
        </div>
      </nav>
    </div>
  )
}

function MainNavigationInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { role } = useUserRole()

  // For role-neutral routes (like /settings), use the authenticated user's role
  // For portal-specific routes, use the pathname to determine context
  const isClientRoute = pathname.startsWith("/client-portal")
  const isStudentRoute =
    pathname.startsWith("/students") ||
    pathname.startsWith("/my-team") ||
    pathname.startsWith("/student-class-course") ||
    pathname.startsWith("/student-hours") ||
    pathname.startsWith("/student-debriefs")
  const isDirectorRoute =
    pathname === "/" ||
    pathname === "/director" ||
    pathname.startsWith("/client-engagements") ||
    pathname.startsWith("/student-progress") ||
    pathname.startsWith("/documents") ||
    pathname.startsWith("/prospects") ||
    pathname.startsWith("/roster") ||
    pathname.startsWith("/archived") ||
    pathname.startsWith("/class-course") ||
    pathname.startsWith("/my-clinic") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/debriefs")

  // Determine if we're on a role-neutral page (e.g. /settings)
  const isRoleNeutralRoute = !isDirectorRoute && !isClientRoute && !isStudentRoute

  // Director Portal Navigation
  const directorNavItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Class Course", href: "/class-course", icon: GraduationCap },
    { name: "Client Engagements", href: "/client-engagements", icon: Briefcase },
    { name: "Student Progress", href: "/student-progress", icon: Users },
    { name: "Debriefs", href: "/debriefs", icon: MessageSquareText },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "My Clinic", href: "/my-clinic", icon: Building2, separator: true },
    { name: "Prospects", href: "/prospects", icon: UserSearch },
    { name: "Roster", href: "/roster", icon: ClipboardList },
    { name: "Archived", href: "/archived", icon: Archive },
  ]

  // Student Portal Navigation
  const studentNavItems = [
    { name: "Dashboard", href: "/students", icon: LayoutDashboard },
    { name: "Class Course", href: "/student-class-course", icon: BookOpen },
    { name: "My Team", href: "/my-team", icon: UsersRound },
    { name: "Debriefs", href: "/student-debriefs", icon: MessageSquareText },
  ]

  // Client Portal Navigation
  const clientNavItems = [
    { name: "Dashboard", href: "/client-portal", icon: LayoutDashboard },
    { name: "My Team", href: "/client-portal?tab=team", icon: UsersRound },
    { name: "Tasks & Q&A", href: "/client-portal?tab=tasks", icon: MessageSquare },
    { name: "Documents", href: "/client-portal?tab=documents", icon: FileText },
  ]

  // On role-neutral routes (like /settings/account), use the user's actual role
  // On portal-specific routes, use the pathname context
  let navItems
  if (isRoleNeutralRoute) {
    if (role === "student") {
      navItems = studentNavItems
    } else if (role === "client") {
      navItems = clientNavItems
    } else {
      navItems = directorNavItems
    }
  } else {
    navItems = isClientRoute ? clientNavItems : isStudentRoute ? studentNavItems : directorNavItems
  }

  const isAccountActive = pathname.startsWith("/settings")

  return (
    <div className="flex flex-col h-full bg-[#112250] shadow-xl border-r border-[#0d1a3d]">
      <div className="p-4 border-b border-[#1a2d52] bg-[#152244]/50">
        <Link
          href="/settings/account"
          className={cn(
            "flex items-center gap-2.5 px-3 py-2.5 text-xs rounded-xl transition-all duration-200",
            isAccountActive
              ? "bg-[#E0C58F] text-[#112250] font-semibold shadow-lg"
              : "text-[#F5F0E9] hover:bg-[#3C507D] hover:text-white",
          )}
        >
          <div
            className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
              isAccountActive ? "bg-[#d0b57f] shadow-sm" : "bg-[#1a2d52]",
            )}
          >
            <User className="h-4 w-4 shrink-0" />
          </div>
          <span className="font-medium">Account</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3C507D] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#4a5f8d]" style={{ scrollbarColor: '#3C507D transparent', scrollbarWidth: 'thin' }}>
        <div className="space-y-1.5">
          {navItems.map((item) => {
            const hrefBase = item.href.split("?")[0]
            const hasQuery = item.href.includes("?")
            let isActive: boolean

            const currentTab = searchParams.get("tab") || ""

            if (hasQuery) {
              // Query-param nav items (e.g. /client-portal?tab=team):
              // Only active when both path AND query param match
              const expectedParams = new URLSearchParams(item.href.split("?")[1])
              const expectedTab = expectedParams.get("tab") || ""
              isActive = pathname === hrefBase && currentTab === expectedTab
            } else {
              // Check if other sibling items use query params on the same base path
              const siblingsUseQuery = navItems.some(
                (ni) => ni !== item && ni.href.includes("?") && ni.href.split("?")[0] === hrefBase,
              )
              if (siblingsUseQuery) {
                // Only active when path matches AND no tab query param is present
                isActive = pathname === item.href && !currentTab
              } else {
                // Standard nav items: exact match or prefix match (but not for root "/")
                isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(hrefBase + "/"))
              }
            }

            return (
              <div key={item.name}>
                {item.separator && (
                  <div className="my-3 flex items-center gap-2">
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-[#3C507D] to-transparent opacity-40" />
                  </div>
                )}
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 text-xs rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-[#E0C58F] text-[#112250] font-semibold shadow-lg"
                      : "text-[#F5F0E9] hover:bg-[#3C507D] hover:text-white hover:shadow-md",
                  )}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200",
                      isActive ? "bg-[#d0b57f] shadow-sm" : "bg-[#1a2d52] group-hover:bg-[#2a3f6d] group-hover:shadow",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                  </div>
                  <span className="font-medium">{item.name}</span>
                </Link>
              </div>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
