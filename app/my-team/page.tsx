import { Suspense } from "react"
import { MyTeamContent } from "@/components/my-team-content"
import { MainNavigation } from "@/components/main-navigation"

function MyTeamLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7f9] to-[#e8eef3]">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>
      <main className="pl-52 pt-14 p-4">
        <div className="flex items-center justify-center h-[calc(100vh-2rem)]">
          <div className="animate-pulse text-[#5f7082]">Loading team data...</div>
        </div>
      </main>
    </div>
  )
}

export default function MyTeamPage() {
  return (
    <Suspense fallback={<MyTeamLoading />}>
      <MyTeamContent />
    </Suspense>
  )
}
