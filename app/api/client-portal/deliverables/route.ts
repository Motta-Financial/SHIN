import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get("clientName")
    const clientId = searchParams.get("clientId")

    const supabase = await createClient()

    let targetClientId = clientId

    if (!clientId && clientName) {
      const { data: client } = await supabase.from("clients").select("id").eq("name", clientName).single()
      if (client) {
        targetClientId = client.id
      }
    }

    if (!targetClientId) {
      return NextResponse.json({ error: "Client ID or name required" }, { status: 400 })
    }

    const { data: documents, error: docsError } = await supabase
      .from("documents")
      .select("*")
      .eq("client_id", targetClientId)
      .order("uploaded_at", { ascending: false })

    if (docsError) {
      console.error("Error fetching documents:", docsError)
    }

    // Get evaluations for documents
    const documentsWithReviews = await Promise.all(
      (documents || []).map(async (doc) => {
        const { data: evaluations } = await supabase.from("evaluations").select("*").eq("document_id", doc.id)

        const { data: reviews } = await supabase.from("document_reviews").select("*").eq("document_id", doc.id)

        return {
          ...doc,
          evaluations: evaluations || [],
          reviews: reviews || [],
        }
      }),
    )

    return NextResponse.json({
      success: true,
      deliverables: documentsWithReviews,
    })
  } catch (error) {
    console.error("Error in deliverables API:", error)
    return NextResponse.json({ error: "Failed to fetch deliverables" }, { status: 500 })
  }
}
