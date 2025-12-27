import useSWR from "swr"

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
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error("Failed to fetch directors")
  }
  return res.json()
}

export function useDirectors() {
  const { data, error, isLoading, mutate } = useSWR<DirectorsResponse>("/api/directors", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // Dedupe requests within 60 seconds
    staleTime: 300000, // Consider data stale after 5 minutes
  })

  return {
    directors: data?.directors || [],
    isLoading,
    isError: error,
    mutate,
  }
}
