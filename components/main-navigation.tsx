"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainNavigation() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-6 border-b bg-background px-6">
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
    </nav>
  )
}
