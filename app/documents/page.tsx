import { MainNavigation } from "@/components/main-navigation"
import { DirectorDocumentsDashboard } from "@/components/director-documents-dashboard"

export default function DocumentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>
      <main className="pl-52 pt-14">
        <div className="p-6">
          <DirectorDocumentsDashboard />
        </div>
      </main>
    </div>
  )
}
