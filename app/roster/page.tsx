"use client"

import { MainNavigation } from "@/components/main-navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RosterPage() {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>

      <div className="pl-52 pt-14">
        <main className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">Roster</Badge>
            <span className="text-xs text-muted-foreground">Manage upcoming semester students and clients</span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Roster Management</CardTitle>
              <CardDescription>Configure student and client assignments for the upcoming semester</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Roster management interface coming soon...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
