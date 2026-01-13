import { Suspense } from "react"
import { MyTeamContent } from "@/components/my-team-content"
import { GlobalHeader } from "@/components/global-header"
import { MainNavigation } from "@/components/main-navigation"
import { StudentPortalHeader } from "@/components/student-portal-header"

function MyTeamLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse text-muted-foreground">Loading team data...</div>
    </div>
  )
}

export default function MyTeamPage() {
  return (
    <>
      <GlobalHeader />
      <div className="flex h-screen pt-14">
        <aside className="w-64 border-r bg-card">
          <MainNavigation />
        </aside>
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            <StudentPortalHeader />
            <div className="mt-6">
              <Suspense fallback={<MyTeamLoading />}>
                <MyTeamContent />
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
