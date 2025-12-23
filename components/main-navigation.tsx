"use client"

import Link from "next/link"
import Image from "next/image"
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
  ChevronRight,
  BookOpen,
  UsersRound,
  Briefcase,
  Building2,
} from "lucide-react"

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
    pathname.startsWith("/my-clinic")

  const isClientRoute = pathname.startsWith("/client-portal")
  const isStudentRoute =
    pathname.startsWith("/students") || pathname.startsWith("/my-team") || pathname.startsWith("/student-class-course")

  const navSections = [
    {
      title: "Current Semester",
      icon: BookOpen,
      items: [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Class Course", href: "/class-course", icon: GraduationCap },
        { name: "Client Engagements", href: "/client-engagements", icon: Briefcase },
        { name: "Student Progress", href: "/student-progress", icon: Users },
        { name: "Documents", href: "/documents", icon: FileText },
        { name: "My Clinic", href: "/my-clinic", icon: Building2 },
      ],
    },
    {
      title: "Prep & Recruit",
      icon: UserSearch,
      items: [
        { name: "Prospect Interviews", href: "/prospects", icon: UserSearch },
        { name: "Roster", href: "/roster", icon: ClipboardList },
      ],
    },
    {
      title: "Archived",
      icon: Archive,
      items: [{ name: "Previous Semesters", href: "/archived", icon: Archive }],
    },
  ]

  const studentNavItems = [
    { name: "My Dashboard", href: "/students", icon: LayoutDashboard },
    { name: "Class Course", href: "/student-class-course", icon: BookOpen },
    { name: "My Team", href: "/my-team", icon: UsersRound },
  ]

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-sidebar-border bg-sidebar">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            {/* SHIN Logo */}
            <Image
              src="/images/shin.png"
              alt="SHIN Logo"
              width={100}
              height={36}
              className="h-8 w-auto brightness-0 invert"
            />
            <div className="h-6 w-px bg-sidebar-border" />
            {/* Portal label */}
            {isDirectorRoute ? (
              <span className="text-sm font-medium text-sidebar-foreground/80">Director Portal</span>
            ) : isClientRoute ? (
              <span className="text-sm font-medium text-sidebar-foreground/80">Client Portal</span>
            ) : (
              <span className="text-sm font-medium text-sidebar-foreground/80">Student Portal</span>
            )}
          </div>

          <div className="flex items-center gap-1 bg-sidebar-accent rounded-lg p-0.5">
            <Link
              href="/"
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                isDirectorRoute
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
              )}
            >
              Director
            </Link>
            <Link
              href="/students"
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                isStudentRoute
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
              )}
            >
              Student
            </Link>
            <Link
              href="/client-portal"
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                isClientRoute
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
              )}
            >
              Client
            </Link>
          </div>
        </div>
      </div>

      {/* Director Portal Sidebar */}
      {isDirectorRoute && (
        <div className="fixed left-0 top-[48px] bottom-0 z-30 group">
          <div className="h-full w-12 bg-muted border-r border-border flex flex-col items-center py-4 gap-2 transition-all group-hover:opacity-0">
            {navSections.map((section) => (
              <div
                key={section.title}
                className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 cursor-pointer transition-colors"
                title={section.title}
              >
                <section.icon className="h-4 w-4" />
              </div>
            ))}
          </div>

          <div className="absolute left-0 top-0 h-full w-52 bg-sidebar border-r border-sidebar-border shadow-lg transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200 ease-out overflow-y-auto">
            <div className="p-3">
              {navSections.map((section, sectionIdx) => (
                <div key={section.title} className={cn(sectionIdx > 0 && "mt-4")}>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                    <section.icon className="h-3.5 w-3.5" />
                    {section.title}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                          pathname === item.href
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                        {pathname === item.href && <ChevronRight className="h-3 w-3 ml-auto" />}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Student Portal Sidebar */}
      {isStudentRoute && (
        <div className="fixed left-0 top-[48px] bottom-0 z-30 group">
          <div className="h-full w-12 bg-muted border-r border-border flex flex-col items-center py-4 gap-2 transition-all group-hover:opacity-0">
            {studentNavItems.map((item) => (
              <div
                key={item.href}
                className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 cursor-pointer transition-colors"
                title={item.name}
              >
                <item.icon className="h-4 w-4" />
              </div>
            ))}
          </div>

          <div className="absolute left-0 top-0 h-full w-48 bg-sidebar border-r border-sidebar-border shadow-lg transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200 ease-out">
            <div className="p-3">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                <GraduationCap className="h-3.5 w-3.5" />
                Student Portal
              </div>
              <div className="mt-2 space-y-0.5">
                {studentNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                      pathname === item.href
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                    {pathname === item.href && <ChevronRight className="h-3 w-3 ml-auto" />}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
