"use client"

import { MainNavigation } from "@/components/main-navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ArchivedPage() {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>

      <div className="pl-52 pt-14">
        <main className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">Archived Semesters</Badge>
            <span className="text-xs text-muted-foreground">View historical semester data</span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Previous Semesters</CardTitle>
              <CardDescription>
                Access historical data, summaries, and deliverables from completed semesters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Archived semester browser coming soon...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
