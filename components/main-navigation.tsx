"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
  HelpCircle,
  Settings,
  MessageSquare,
} from "lucide-react"
import { EditProfileDialog } from "@/components/edit-profile-dialog"

export function MainNavigation() {
  const pathname = usePathname()

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
    pathname.startsWith("/admin")

  const isClientRoute = pathname.startsWith("/client-portal")
  const isStudentRoute =
    pathname.startsWith("/students") ||
    pathname.startsWith("/my-team") ||
    pathname.startsWith("/student-class-course") ||
    pathname.startsWith("/student-hours")

  // Director Portal Navigation
  const directorNavItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Class Course", href: "/class-course", icon: GraduationCap },
    { name: "Client Engagements", href: "/client-engagements", icon: Briefcase },
    { name: "Student Progress", href: "/student-progress", icon: Users },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "My Clinic", href: "/my-clinic", icon: Building2 },
    { name: "Prospects", href: "/prospects", icon: UserSearch },
    { name: "Roster", href: "/roster", icon: ClipboardList },
    { name: "Archived", href: "/archived", icon: Archive },
  ]

  // Student Portal Navigation
  const studentNavItems = [
    { name: "Dashboard", href: "/students", icon: LayoutDashboard },
    { name: "Class Course", href: "/student-class-course", icon: BookOpen },
    { name: "My Team", href: "/my-team", icon: UsersRound },
  ]

  // Client Portal Navigation
  const clientNavItems = [
    { name: "Dashboard", href: "/client-portal", icon: LayoutDashboard },
    { name: "My Team", href: "/client-portal?tab=team", icon: UsersRound },
    { name: "Tasks & Q&A", href: "/client-portal?tab=tasks", icon: MessageSquare },
    { name: "Documents", href: "/client-portal?tab=documents", icon: FileText },
  ]

  const navItems = isClientRoute ? clientNavItems : isStudentRoute ? studentNavItems : directorNavItems

  return (
    <div className="flex flex-col h-full">
      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href.split("?")[0]))

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-md transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t p-2">
        <EditProfileDialog
          userType={isClientRoute ? "client" : isStudentRoute ? "student" : "director"}
          trigger={
            <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
          }
        />
        <div className="flex items-center gap-2 px-2.5 py-2 text-xs text-muted-foreground">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Need help? Ask SHIN</span>
        </div>
      </div>
    </div>
  )
}
