import { createClient } from "./client"

export interface UploadOptions {
  bucket: string
  path: string
  file: File
  upsert?: boolean
}

export interface DownloadOptions {
  bucket: string
  path: string
}

/**
 * Upload a file to Supabase Storage
 * For files > 6MB, consider using TUS resumable upload
 */
export async function uploadFile({ bucket, path, file, upsert = false }: UploadOptions) {
  const supabase = createClient()

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert,
  })

  if (error) {
    console.error("[v0] Storage upload error:", error)
    throw error
  }

  return data
}

/**
 * Get public URL for a file in Supabase Storage
 */
export function getPublicUrl({ bucket, path }: DownloadOptions) {
  const supabase = createClient()

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)

  return data.publicUrl
}

/**
 * Download a file from Supabase Storage
 */
export async function downloadFile({ bucket, path }: DownloadOptions) {
  const supabase = createClient()

  const { data, error } = await supabase.storage.from(bucket).download(path)

  if (error) {
    console.error("[v0] Storage download error:", error)
    throw error
  }

  return data
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile({ bucket, path }: DownloadOptions) {
  const supabase = createClient()

  const { data, error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    console.error("[v0] Storage delete error:", error)
    throw error
  }

  return data
}

/**
 * List files in a bucket
 */
export async function listFiles(bucket: string, folder?: string) {
  const supabase = createClient()

  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 100,
    offset: 0,
    sortBy: { column: "name", order: "asc" },
  })

  if (error) {
    console.error("[v0] Storage list error:", error)
    throw error
  }

  return data
}
