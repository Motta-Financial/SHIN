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
      </div>
      {/* <ClerkUserButton /> */}
    </nav>
  )
}
