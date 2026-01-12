import { Suspense } from "react"
import { DebriefsContent } from "@/components/debriefs-content"

export default function DebriefsPage() {
  return (
    <Suspense fallback={null}>
      <DebriefsContent />
    </Suspense>
  )
}
