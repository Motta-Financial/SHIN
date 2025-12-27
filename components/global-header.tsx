"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Building2, GraduationCap, Briefcase } from "lucide-react"
import { AdvancedSearch } from "@/components/advanced-search"

export function GlobalHeader() {
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

  const portalTabs = [
    { name: "Director", href: "/", icon: Building2 },
    { name: "Student", href: "/students", icon: GraduationCap },
    { name: "Client", href: "/client-portal", icon: Briefcase },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b z-50 flex items-center px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mr-6">
        <Image src="/images/shin.png" alt="SHIN Logo" width={32} height={32} className="object-contain" />
        <span className="font-semibold text-lg hidden sm:inline">SHIN</span>
      </Link>

      {/* Portal Toggle */}
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="flex items-center">
        <AdvancedSearch />
      </div>
    </header>
  )
}
