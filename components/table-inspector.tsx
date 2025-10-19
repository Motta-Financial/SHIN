"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TableInspector() {
  const [tables, setTables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/airtable/inspect")
      .then((res) => res.json())
      .then((data) => {
        console.log("[v0] All tables:", data.tables)
        setTables(data.tables || [])
        setLoading(false)
      })
      .catch((error) => {
        console.error("[v0] Failed to fetch tables:", error)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading tables...</div>

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Airtable Tables Inspector</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tables.map((table) => (
            <div key={table.id} className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-bold text-lg">{table.name}</h3>
              <p className="text-sm text-muted-foreground">ID: {table.id}</p>
              <p className="text-sm">Fields: {table.fields?.join(", ")}</p>
              {table.sampleRecord && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-blue-600">View sample record</summary>
                  <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(table.sampleRecord, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
