"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
// import { ClerkUserButton } from "./user-button"

export function MainNavigation() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-1 items-center justify-between gap-6 border-b bg-background px-6">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className={cn(
            "border-b-2 px-4 py-4 text-sm font-medium transition-colors hover:text-foreground",
            pathname === "/" ? "border-primary text-foreground" : "border-transparent text-muted-foreground",
          )}
        >
          Clinic Dashboard
        </Link>
        <Link
          href="/prospects"
          className={cn(
            "border-b-2 px-4 py-4 text-sm font-medium transition-colors hover:text-foreground",
            pathname === "/prospects" ? "border-primary text-foreground" : "border-transparent text-muted-foreground",
          )}
        >
          Prospect Interviews
        </Link>
        <Link
          href="/students"
          className={cn(
            "border-b-2 px-4 py-4 text-sm font-medium transition-colors hover:text-foreground",
            pathname === "/students" ? "border-primary text-foreground" : "border-transparent text-muted-foreground",
          )}
        >
          Student Dashboard
        </Link>
        <Link
          href="/submit-debrief"
          className={cn(
            "border-b-2 px-4 py-4 text-sm font-medium transition-colors hover:text-foreground",
            pathname === "/submit-debrief"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground",
          )}
        >
          Submit Debrief
        </Link>
        <Link
          href="/submit-attendance"
          className={cn(
            "border-b-2 px-4 py-4 text-sm font-medium transition-colors hover:text-foreground",
            pathname === "/submit-attendance"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground",
          )}
        >
          Submit Attendance
        </Link>
        <Link
          href="/submit-client"
          className={cn(
            "border-b-2 px-4 py-4 text-sm font-medium transition-colors hover:text-foreground",
            pathname === "/submit-client"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground",
          )}
        >
          Submit Client
        </Link>
        <Link
          href="/submit-evaluation"
          className={cn(
            "border-b-2 px-4 py-4 text-sm font-medium transition-colors hover:text-foreground",
            pathname === "/submit-evaluation"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground",
          )}
        >
          Submit Evaluation
        </Link>
        <Link
          href="/admin/setup"
          className={cn(
            "border-b-2 px-4 py-4 text-sm font-medium transition-colors hover:text-foreground",
            pathname === "/admin/setup" ? "border-primary text-foreground" : "border-transparent text-muted-foreground",
          )}
        >
          Database Setup
        </Link>
      </div>
      {/* <ClerkUserButton /> */}
    </nav>
  )
}
