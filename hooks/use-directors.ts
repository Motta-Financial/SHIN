import useSWR from "swr"
import { fetchWithRateLimit } from "@/lib/fetch-with-rate-limit"

interface Director {
  id: string
  full_name: string
  first_name?: string
  last_name?: string
  clinic: string
  clinic_id?: string
  email: string
  job_title?: string
  role?: string
}

interface DirectorsResponse {
  directors: Director[]
}

const fetcher = async (url: string): Promise<DirectorsResponse> => {
  const res = await fetchWithRateLimit(url)
  if (!res.ok) {
    throw new Error("Failed to fetch directors")
  }
  return res.json()
}

export function useDirectors() {
  const { data, error, isLoading, mutate } = useSWR<DirectorsResponse>("/api/directors", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
    errorRetryCount: 3,
    errorRetryInterval: 3000,
  })

  return {
    directors: data?.directors || [],
    isLoading,
    isError: error,
    mutate,
  }
}
