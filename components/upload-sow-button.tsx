"use client"

import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { useState } from "react"

export function UploadSOWButton() {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")

  const handleUpload = async () => {
    setUploading(true)
    setMessage("")

    try {
      const response = await fetch("/api/upload-sow", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setMessage("✓ SOW documents uploaded successfully!")
        // Reload the page after 2 seconds to show the new documents
        setTimeout(() => window.location.reload(), 2000)
      } else {
        setMessage("✗ Failed to upload SOW documents")
      }
    } catch (error) {
      console.error("[v0] Error uploading SOWs:", error)
      setMessage("✗ Error uploading SOW documents")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleUpload}
        disabled={uploading}
        className="bg-[#0077B6] hover:bg-[#005a8c] text-white"
        size="sm"
      >
        <Upload className="h-4 w-4 mr-2" />
        {uploading ? "Uploading SOWs..." : "Upload SOW Documents"}
      </Button>
      {message && <span className={message.startsWith("✓") ? "text-green-600" : "text-red-600"}>{message}</span>}
    </div>
  )
}
