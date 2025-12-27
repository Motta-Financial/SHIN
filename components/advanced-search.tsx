"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Search,
  FileText,
  Users,
  Briefcase,
  ClipboardList,
  Calendar,
  X,
  Loader2,
  ChevronRight,
  Clock,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  type: "document" | "debrief" | "student" | "client" | "attendance" | "meeting" | "notification"
  title: string
  subtitle: string
  description?: string
  date?: string
  url?: string
  metadata?: Record<string, string>
}

interface SearchFilters {
  documents: boolean
  debriefs: boolean
  students: boolean
  clients: boolean
  attendance: boolean
  meetings: boolean
  notifications: boolean
}

const RESULT_TYPE_CONFIG = {
  document: { icon: FileText, color: "text-blue-500", bgColor: "bg-blue-500/10", label: "Document" },
  debrief: { icon: ClipboardList, color: "text-green-500", bgColor: "bg-green-500/10", label: "Debrief" },
  student: { icon: Users, color: "text-purple-500", bgColor: "bg-purple-500/10", label: "Student" },
  client: { icon: Briefcase, color: "text-amber-500", bgColor: "bg-amber-500/10", label: "Client" },
  attendance: { icon: Calendar, color: "text-cyan-500", bgColor: "bg-cyan-500/10", label: "Attendance" },
  meeting: { icon: Clock, color: "text-pink-500", bgColor: "bg-pink-500/10", label: "Meeting" },
  notification: { icon: FileText, color: "text-orange-500", bgColor: "bg-orange-500/10", label: "Notification" },
}

export function AdvancedSearch() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    documents: true,
    debriefs: true,
    students: true,
    clients: true,
    attendance: true,
    meetings: true,
    notifications: true,
  })

  // Determine portal type
  const portalType = pathname.startsWith("/client-portal")
    ? "client"
    : pathname.startsWith("/students") || pathname.startsWith("/student-")
      ? "student"
      : "director"

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentSearches")
    if (stored) {
      setRecentSearches(JSON.parse(stored))
    }
  }, [])

  // Save recent search
  const saveRecentSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return
      const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem("recentSearches", JSON.stringify(updated))
    },
    [recentSearches],
  )

  // Perform search
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const activeFilters = Object.entries(filters)
          .filter(([_, enabled]) => enabled)
          .map(([key]) => key)
          .join(",")

        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}&portal=${portalType}&filters=${activeFilters}`,
        )

        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
        }
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    },
    [filters, portalType],
  )

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, performSearch])

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query)
    setOpen(false)
    setQuery("")

    if (result.url) {
      router.push(result.url)
    }
  }

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="relative h-9 w-9 p-0 xl:h-9 xl:w-60 xl:justify-start xl:px-3 xl:py-2 bg-transparent"
        >
          <Search className="h-4 w-4 xl:mr-2" />
          <span className="hidden xl:inline-flex">Search...</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[600px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search documents, debriefs, students, clients..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {query && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setQuery("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={cn("ml-1 h-7 px-2", showFilters && "bg-muted")}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-1" />
              <span className="text-xs">{activeFilterCount}</span>
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="border-b px-3 py-2 bg-muted/30">
              <div className="flex flex-wrap gap-2">
                {Object.entries(RESULT_TYPE_CONFIG).map(([key, config]) => (
                  <label
                    key={key}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs cursor-pointer transition-colors",
                      filters[key as keyof SearchFilters]
                        ? `${config.bgColor} ${config.color}`
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Checkbox
                      checked={filters[key as keyof SearchFilters]}
                      onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, [key]: checked }))}
                      className="h-3 w-3"
                    />
                    <config.icon className="h-3 w-3" />
                    {config.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && query.length < 2 && (
              <>
                {recentSearches.length > 0 && (
                  <CommandGroup heading="Recent Searches">
                    {recentSearches.map((search, index) => (
                      <CommandItem
                        key={index}
                        onSelect={() => {
                          setQuery(search)
                          performSearch(search)
                        }}
                        className="flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{search}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                <CommandGroup heading="Quick Actions">
                  <CommandItem
                    onSelect={() => {
                      setQuery("debrief")
                      performSearch("debrief")
                    }}
                  >
                    <ClipboardList className="mr-2 h-4 w-4 text-green-500" />
                    <span>Search debriefs</span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => {
                      setQuery("document")
                      performSearch("document")
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4 text-blue-500" />
                    <span>Search documents</span>
                  </CommandItem>
                  {portalType === "director" && (
                    <CommandItem
                      onSelect={() => {
                        setQuery("student")
                        performSearch("student")
                      }}
                    >
                      <Users className="mr-2 h-4 w-4 text-purple-500" />
                      <span>Search students</span>
                    </CommandItem>
                  )}
                </CommandGroup>
              </>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <CommandEmpty>
                <div className="flex flex-col items-center py-6">
                  <Search className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
                </div>
              </CommandEmpty>
            )}

            {!loading && results.length > 0 && (
              <ScrollArea className="max-h-[400px]">
                {/* Group results by type */}
                {Object.entries(RESULT_TYPE_CONFIG).map(([type, config]) => {
                  const typeResults = results.filter((r) => r.type === type)
                  if (typeResults.length === 0) return null

                  return (
                    <CommandGroup key={type} heading={`${config.label}s (${typeResults.length})`}>
                      {typeResults.map((result) => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => handleResultClick(result)}
                          className="flex items-start gap-3 py-3"
                        >
                          <div className={cn("p-1.5 rounded-md mt-0.5", config.bgColor)}>
                            <config.icon className={cn("h-4 w-4", config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{result.title}</span>
                              {result.metadata?.status && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  {result.metadata.status}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                            {result.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{result.description}</p>
                            )}
                            {result.date && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {new Date(result.date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )
                })}
              </ScrollArea>
            )}
          </CommandList>

          <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
            <span>{results.length > 0 ? `${results.length} results` : "Type to search"}</span>
            <div className="flex items-center gap-2">
              <kbd className="rounded border bg-muted px-1.5 py-0.5">↵</kbd>
              <span>to select</span>
              <kbd className="rounded border bg-muted px-1.5 py-0.5">esc</kbd>
              <span>to close</span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
