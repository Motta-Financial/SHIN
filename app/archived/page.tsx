"use client"

import { MainNavigation } from "@/components/main-navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ArchivedPage() {
  return (
    <div className="min-h-screen bg-background pt-[41px] pl-12">
      <MainNavigation />

      <div className="bg-gradient-to-br from-blue-50/40 via-background to-blue-100/30">
        <div className="container mx-auto px-4 pt-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">Archived Semesters</Badge>
            <span className="text-xs text-muted-foreground">View historical semester data</span>
          </div>
        </div>

        <main className="container mx-auto px-4 py-8">
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
