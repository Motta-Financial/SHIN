"use client"

import { MainNavigation } from "@/components/main-navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RosterPage() {
  return (
    <div className="min-h-screen bg-background pt-[41px] pl-12">
      <MainNavigation />

      <div className="bg-gradient-to-br from-blue-50/40 via-background to-blue-100/30">
        <div className="container mx-auto px-4 pt-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">Roster</Badge>
            <span className="text-xs text-muted-foreground">Manage upcoming semester students and clients</span>
          </div>
        </div>

        <main className="container mx-auto px-4 py-8">
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
