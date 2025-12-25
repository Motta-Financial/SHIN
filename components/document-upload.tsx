"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, X, Loader2, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

interface UploadedFile {
  id?: string
  name: string
  url: string
  size: number
  uploadedAt: string
}

interface DocumentUploadProps {
  clientId?: string // Added clientId for proper Supabase mapping
  clientName?: string
  studentId?: string // Added studentId for proper Supabase mapping
  studentName?: string
  clinic?: string
  submissionType?: string
  title?: string
  description?: string
  onUploadComplete?: (files: UploadedFile[]) => void
  acceptedTypes?: string
  maxFileSize?: number // in MB
  showMetadataFields?: boolean
  compact?: boolean
}

export function DocumentUpload({
  clientId = "", // Added clientId
  clientName = "",
  studentId = "", // Added studentId
  studentName = "",
  clinic = "",
  submissionType = "document",
  title = "Upload Documents",
  description = "Upload files to share with your team",
  onUploadComplete,
  acceptedTypes = ".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.png,.jpg,.jpeg",
  maxFileSize = 50,
  showMetadataFields = false,
  compact = false,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [fileDescription, setFileDescription] = useState("")
  const [customClientName, setCustomClientName] = useState(clientName)
  const { toast } = useToast()

  const CHUNK_SIZE = 3 * 1024 * 1024 // 3MB chunks

  const uploadFileInChunks = async (file: File) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    const uploadId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    const chunkUrls: string[] = []

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

      const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100)
      setUploadProgress(progress)
    }

    const completeResponse = await fetch("/api/upload-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadId,
        fileName: file.name,
        fileSize: file.size,
        clientId, // Added clientId
        clientName: customClientName || clientName,
        studentId, // Added studentId
        studentName,
        submissionType,
        chunkUrls,
      }),
    })

    if (!completeResponse.ok) {
      throw new Error("Failed to complete upload")
    }

    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        studentId,
        studentName,
        clientName: customClientName || clientName,
        fileUrl: chunkUrls[0],
        fileName: file.name,
        description: fileDescription,
        clinic,
        submissionType,
      }),
    })

    return {
      name: file.name,
      url: chunkUrls[0],
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }
  }

  const uploadFileDirect = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("clientId", clientId) // Added clientId
    formData.append("clientName", customClientName || clientName)
    formData.append("studentId", studentId) // Added studentId
    formData.append("studentName", studentName)
    formData.append("submissionType", submissionType)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to upload file")
    }

    const data = await response.json()

    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        studentId,
        studentName,
        clientName: customClientName || clientName,
        fileUrl: data.url,
        fileName: file.name,
        description: fileDescription,
        clinic,
        submissionType,
      }),
    })

    return {
      name: file.name,
      url: data.url,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const maxFileSizeBytes = maxFileSize * 1024 * 1024
    const validFiles = Array.from(files).filter((file) => {
      if (file.size > maxFileSizeBytes) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${maxFileSize}MB limit`,
          variant: "destructive",
        })
        return false
      }
      return true
    })

    if (validFiles.length === 0) {
      event.target.value = ""
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const results: UploadedFile[] = []

      for (const file of validFiles) {
        const result = file.size > 4 * 1024 * 1024 ? await uploadFileInChunks(file) : await uploadFileDirect(file)
        results.push(result)
      }

      setUploadedFiles((prev) => [...prev, ...results])

      toast({
        title: "Upload successful",
        description: `${results.length} file(s) uploaded successfully`,
      })

      onUploadComplete?.(results)
      setFileDescription("")
    } catch (error) {
      console.error("[v0] Upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
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

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => document.getElementById(`doc-upload-compact-${clientId || "default"}`)?.click()}
            disabled={uploading}
            variant="outline"
            size="sm"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </>
            )}
          </Button>
          <input
            id={`doc-upload-compact-${clientId || "default"}`}
            type="file"
            accept={acceptedTypes}
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {uploading && uploadProgress > 0 && (
          <div className="space-y-1">
            <Progress value={uploadProgress} className="h-1" />
            <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <div className="space-y-1">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="truncate max-w-[200px]">{file.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showMetadataFields && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={customClientName}
                onChange={(e) => setCustomClientName(e.target.value)}
                placeholder="Enter client name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                placeholder="Brief description of the document"
                rows={2}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button
            onClick={() => document.getElementById(`doc-upload-${clientId || "default"}`)?.click()}
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
            id={`doc-upload-${clientId || "default"}`}
            type="file"
            accept={acceptedTypes}
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <span className="text-sm text-muted-foreground">Up to {maxFileSize}MB per file</span>
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
