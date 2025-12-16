"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { UserButton } from "@/components/auth/user-button"
import { useUser } from "@/lib/supabase/hooks"

export function MainNavigation() {
  const pathname = usePathname()
  const { profile } = useUser()

  // Define role-based navigation items
  const navItems = [
    { href: "/", label: "Clinic Dashboard", roles: ["admin", "director"] },
    { href: "/prospects", label: "Prospect Interviews", roles: ["admin", "director"] },
    { href: "/students", label: "Student Dashboard", roles: ["admin", "director", "student"] },
    { href: "/submit-debrief", label: "Submit Debrief", roles: ["admin", "director", "student"] },
    { href: "/submit-attendance", label: "Submit Attendance", roles: ["admin", "director"] },
    { href: "/submit-client", label: "Submit Client", roles: ["admin", "director"] },
    { href: "/submit-evaluation", label: "Submit Evaluation", roles: ["admin", "director"] },
    { href: "/admin/setup", label: "Database Setup", roles: ["admin"] },
  ]

  // Filter navigation items based on user role
  const visibleItems = navItems.filter((item) => {
    if (!profile?.role) return false
    return item.roles.includes(profile.role) || profile.is_admin
  })

  return (
    <nav className="flex flex-1 items-center justify-between gap-6 border-b bg-background px-6">
      <div className="flex items-center gap-6">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "border-b-2 px-4 py-4 text-sm font-medium transition-colors hover:text-foreground",
              pathname === item.href ? "border-primary text-foreground" : "border-transparent text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <UserButton />
    </nav>
  )
}
