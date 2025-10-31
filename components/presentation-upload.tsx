"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

interface UploadedFile {
  name: string
  url: string
  size: number
  uploadedAt: string
}

interface PresentationUploadProps {
  clientName: string
  onUploadComplete?: (files: UploadedFile[]) => void
}

const CHUNK_SIZE = 3 * 1024 * 1024 // 3MB chunks

export function PresentationUpload({ clientName, onUploadComplete }: PresentationUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const { toast } = useToast()

  const uploadFileInChunks = async (file: File) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    const uploadId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    const chunkUrls: string[] = []

    console.log(`[v0] Starting chunked upload for ${file.name}: ${totalChunks} chunks`)

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)

      const formData = new FormData()
      formData.append("chunk", chunk)
      formData.append("chunkIndex", chunkIndex.toString())
      formData.append("totalChunks", totalChunks.toString())
      formData.append("fileName", file.name)
      formData.append("uploadId", uploadId)

      const response = await fetch("/api/upload-chunk", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Failed to upload chunk ${chunkIndex + 1}/${totalChunks}`)
      }

      const data = await response.json()
      chunkUrls.push(data.chunkUrl)

      // Update progress
      const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100)
      setUploadProgress(progress)
      console.log(`[v0] Chunk ${chunkIndex + 1}/${totalChunks} uploaded (${progress}%)`)
    }

    const getSubmissionType = (fileName: string) => {
      const ext = fileName.toLowerCase().split(".").pop()
      if (ext === "pptx" || ext === "ppt") return "Midterm PPT"
      if (ext === "pdf") return "PDF Document"
      if (ext === "docx" || ext === "doc") return "Word Document"
      return "Document"
    }

    // Complete the upload
    const completeResponse = await fetch("/api/upload-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadId,
        fileName: file.name,
        fileSize: file.size,
        clientName,
        studentName: "Director Upload",
        submissionType: getSubmissionType(file.name),
        chunkUrls,
      }),
    })

    if (!completeResponse.ok) {
      throw new Error("Failed to complete upload")
    }

    const completeData = await completeResponse.json()
    console.log(`[v0] Upload completed successfully for ${file.name}`)

    return {
      name: file.name,
      url: chunkUrls[0],
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[v0] File input changed, checking files...")
    const files = event.target.files
    if (!files || files.length === 0) {
      console.log("[v0] No files selected")
      return
    }

    console.log(
      `[v0] ${files.length} file(s) selected:`,
      Array.from(files).map((f) => `${f.name} (${(f.size / (1024 * 1024)).toFixed(2)}MB)`),
    )

    const validFiles = Array.from(files).filter((file) => {
      const fileName = file.name.toLowerCase()
      return (
        fileName.endsWith(".pptx") ||
        fileName.endsWith(".ppt") ||
        fileName.endsWith(".pdf") ||
        fileName.endsWith(".docx") ||
        fileName.endsWith(".doc")
      )
    })

    if (validFiles.length === 0) {
      console.log("[v0] No valid document files found")
      toast({
        title: "Invalid file type",
        description: "Please upload PowerPoint (.pptx, .ppt), PDF (.pdf), or Word (.docx, .doc) files",
        variant: "destructive",
      })
      return
    }

    console.log(`[v0] ${validFiles.length} valid document file(s) found`)

    const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
    const oversizedFiles = validFiles.filter((file) => file.size > MAX_FILE_SIZE)
    if (oversizedFiles.length > 0) {
      console.log(
        `[v0] File size validation FAILED:`,
        oversizedFiles.map((f) => `${f.name} is ${(f.size / (1024 * 1024)).toFixed(2)}MB (limit: 50MB)`),
      )
      toast({
        title: "File too large",
        description: `Files must be under 50MB. ${oversizedFiles[0].name} is ${(oversizedFiles[0].size / (1024 * 1024)).toFixed(1)}MB.`,
        variant: "destructive",
      })
      event.target.value = ""
      return
    }

    console.log("[v0] All files passed validation, starting upload...")
    setUploading(true)
    setUploadProgress(0)

    try {
      const results: UploadedFile[] = []

      for (const file of validFiles) {
        console.log(`[v0] Uploading file: ${file.name} Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`)
        const result = await uploadFileInChunks(file)
        results.push(result)
      }

      setUploadedFiles((prev) => [...prev, ...results])

      console.log(`[v0] All uploads completed successfully: ${results.length} file(s)`)
      toast({
        title: "Upload successful",
        description: `${results.length} document(s) uploaded successfully`,
      })

      onUploadComplete?.(results)
    } catch (error) {
      console.error("[v0] Upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload documents",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
      event.target.value = ""
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Upload Documents</CardTitle>
        <CardDescription>Upload presentations, PDFs, or Word documents for {clientName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => document.getElementById("pptx-upload")?.click()}
            disabled={uploading}
            className="bg-[#003478] hover:bg-[#002557]"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Select Files
              </>
            )}
          </Button>
          <input
            id="pptx-upload"
            type="file"
            accept=".pptx,.ppt,.pdf,.docx,.doc"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <span className="text-sm text-muted-foreground">PowerPoint, PDF, or Word (up to 50MB each)</span>
        </div>

        {uploading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Uploading...</span>
              <span className="font-medium">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Files</h4>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-[#003478]" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => window.open(file.url, "_blank")}>
                      View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
