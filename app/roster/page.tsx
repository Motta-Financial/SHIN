"use client"

import { MainNavigation } from "@/components/main-navigation"
import { Badge } from "@/components/ui/badge"
import { OrgChart } from "@/components/org-chart"

export default function RosterPage() {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>

      <div className="pl-52 pt-14">
        <main className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary text-primary-foreground">Roster</Badge>
            <span className="text-sm text-muted-foreground">
              View SEED program organizational structure and team assignments
            </span>
          </div>

          <OrgChart />
        </main>
      </div>
    </div>
  )
}
