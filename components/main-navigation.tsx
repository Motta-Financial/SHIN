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
  HelpCircle,
  FolderOpen,
  TrendingUp,
  Upload,
  User,
  Settings,
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
    pathname.startsWith("/students") || pathname.startsWith("/my-team") || pathname.startsWith("/student-class-course")

  // Director Portal Navigation
  const directorNavSections = [
    {
      title: "Current Semester",
      icon: BookOpen,
      items: [
        { name: "Dashboard", href: "/", icon: LayoutDashboard, description: "Overview & KPIs" },
        { name: "Class Course", href: "/class-course", icon: GraduationCap, description: "Weekly agenda & materials" },
        { name: "Client Engagements", href: "/client-engagements", icon: Briefcase, description: "Client projects" },
        { name: "Student Progress", href: "/student-progress", icon: Users, description: "Track student work" },
        { name: "Documents", href: "/documents", icon: FileText, description: "Files & uploads" },
        { name: "My Clinic", href: "/my-clinic", icon: Building2, description: "Clinic management" },
      ],
    },
    {
      title: "Prep & Recruit",
      icon: UserSearch,
      items: [
        { name: "Prospect Interviews", href: "/prospects", icon: UserSearch, description: "New applicants" },
        { name: "Roster", href: "/roster", icon: ClipboardList, description: "Student roster" },
      ],
    },
    {
      title: "Archived",
      icon: Archive,
      items: [{ name: "Previous Semesters", href: "/archived", icon: Archive, description: "Historical data" }],
    },
  ]

  // Student Portal Navigation
  const studentNavSections = [
    {
      title: "My Portal",
      icon: GraduationCap,
      items: [
        { name: "Dashboard", href: "/students", icon: LayoutDashboard, description: "Your overview" },
        { name: "Class Course", href: "/student-class-course", icon: BookOpen, description: "Weekly agenda" },
        { name: "My Team", href: "/my-team", icon: UsersRound, description: "Team members" },
      ],
    },
  ]

  // Client Portal Navigation
  const clientNavSections = [
    {
      title: "Client Portal",
      icon: Briefcase,
      items: [
        { name: "Dashboard", href: "/client-portal", icon: LayoutDashboard, description: "Your overview" },
        { name: "My Team", href: "/client-portal#team", icon: UsersRound, description: "Student team" },
        { name: "Progress", href: "/client-portal#progress", icon: TrendingUp, description: "Project progress" },
        { name: "Deliverables", href: "/client-portal#deliverables", icon: FolderOpen, description: "Project files" },
        { name: "Documents", href: "/client-portal#documents", icon: Upload, description: "Upload files" },
        { name: "Q&A", href: "/client-portal#questions", icon: HelpCircle, description: "Ask questions" },
      ],
    },
  ]

  const getCurrentPortalName = () => {
    if (isClientRoute) return "Client Portal"
    if (isStudentRoute) return "Student Portal"
    return "Director Portal"
  }

  const getCurrentNavSections = () => {
    if (isClientRoute) return clientNavSections
    if (isStudentRoute) return studentNavSections
    return directorNavSections
  }

  const getCurrentUserType = (): "director" | "student" | "client" => {
    if (isClientRoute) return "client"
    if (isStudentRoute) return "student"
    return "director"
  }

  const navSections = getCurrentNavSections()

  return (
    <>
      {/* Top Header Bar */}
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
            {/* Portal label with description */}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground/90">{getCurrentPortalName()}</span>
              <span className="text-[10px] text-sidebar-foreground/50">
                {isDirectorRoute && "Manage clinics & students"}
                {isStudentRoute && "Track your progress"}
                {isClientRoute && "View your project"}
              </span>
            </div>
          </div>

          {/* Portal Switcher */}
          <div className="flex items-center gap-1 bg-sidebar-accent rounded-lg p-0.5">
            <Link
              href="/"
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                isDirectorRoute
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3 w-3" />
                Director
              </span>
            </Link>
            <Link
              href="/students"
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                isStudentRoute
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-3 w-3" />
                Student
              </span>
            </Link>
            <Link
              href="/client-portal"
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                isClientRoute
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3 w-3" />
                Client
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Sidebar - Now consistent for all portals */}
      <div className="fixed left-0 top-[48px] bottom-0 z-30 group">
        {/* Collapsed Icon Bar */}
        <div className="h-full w-12 bg-muted border-r border-border flex flex-col items-center py-4 gap-2 transition-all group-hover:opacity-0">
          {navSections.map((section) => (
            <div key={section.title} className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 cursor-pointer transition-colors"
                title={section.title}
              >
                <section.icon className="h-4 w-4" />
              </div>
            </div>
          ))}
          <div className="mt-auto flex flex-col items-center gap-1">
            <div
              className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 cursor-pointer transition-colors"
              title="Edit Profile"
            >
              <Settings className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Expanded Sidebar */}
        <div className="absolute left-0 top-0 h-full w-56 bg-sidebar border-r border-sidebar-border shadow-lg transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200 ease-out overflow-y-auto">
          <div className="p-3">
            {navSections.map((section, sectionIdx) => (
              <div key={section.title} className={cn(sectionIdx > 0 && "mt-4 pt-4 border-t border-sidebar-border/50")}>
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                  <section.icon className="h-3.5 w-3.5" />
                  {section.title}
                </div>
                <div className="mt-1 space-y-0.5">
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href.split("#")[0]))
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors group/item",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        )}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="truncate">{item.name}</span>
                          <span
                            className={cn(
                              "text-[10px] truncate",
                              isActive ? "text-sidebar-primary-foreground/70" : "text-sidebar-foreground/50",
                            )}
                          >
                            {item.description}
                          </span>
                        </div>
                        {isActive && <ChevronRight className="h-3 w-3 flex-shrink-0" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}

            <div className="mt-4 pt-4 border-t border-sidebar-border/50">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                <Settings className="h-3.5 w-3.5" />
                Account
              </div>
              <div className="mt-1 space-y-0.5">
                <EditProfileDialog
                  userType={getCurrentUserType()}
                  trigger={
                    <button className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <div className="flex flex-col flex-1 min-w-0 text-left">
                        <span className="truncate">Edit Profile</span>
                        <span className="text-[10px] truncate text-sidebar-foreground/50">Update your information</span>
                      </div>
                    </button>
                  }
                />
              </div>
            </div>
          </div>

          {/* Quick Help Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-sidebar-border/50 bg-sidebar">
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-sidebar-foreground/50">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Need help? Ask SHIN</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
