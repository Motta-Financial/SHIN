"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Send, Sparkles, User } from "lucide-react"
import { cn } from "@/lib/utils"

// SHIN Bridge Icon Component
function ShinBridgeIcon({ className, animate = false }: { className?: string; animate?: boolean }) {
  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("w-full h-full", animate && "animate-pulse")}
      >
        {/* Outer glow effect */}
        <defs>
          <linearGradient id="shinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Bridge structure */}
        <path
          d="M10 70 Q25 40 50 35 Q75 40 90 70"
          stroke="url(#shinGradient)"
          strokeWidth="4"
          fill="none"
          filter="url(#glow)"
        />

        {/* Bridge pillars */}
        <line x1="25" y1="55" x2="25" y2="75" stroke="url(#shinGradient)" strokeWidth="3" />
        <line x1="50" y1="35" x2="50" y2="75" stroke="url(#shinGradient)" strokeWidth="3" />
        <line x1="75" y1="55" x2="75" y2="75" stroke="url(#shinGradient)" strokeWidth="3" />

        {/* Base line */}
        <line x1="10" y1="75" x2="90" y2="75" stroke="url(#shinGradient)" strokeWidth="2" />

        {/* Neural network dots */}
        <circle cx="50" cy="25" r="4" fill="url(#shinGradient)" filter="url(#glow)">
          {animate && <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />}
        </circle>
        <circle cx="30" cy="32" r="2.5" fill="url(#shinGradient)" filter="url(#glow)">
          {animate && <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />}
        </circle>
        <circle cx="70" cy="32" r="2.5" fill="url(#shinGradient)" filter="url(#glow)">
          {animate && <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />}
        </circle>

        {/* Connection lines */}
        <line x1="50" y1="25" x2="30" y2="32" stroke="url(#shinGradient)" strokeWidth="1" opacity="0.6" />
        <line x1="50" y1="25" x2="70" y2="32" stroke="url(#shinGradient)" strokeWidth="1" opacity="0.6" />
      </svg>
    </div>
  )
}

// Pulsing animation when thinking
function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="relative">
        <ShinBridgeIcon className="w-8 h-8" animate={true} />
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full blur-lg opacity-30 animate-pulse" />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground">SHIN is thinking</span>
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </span>
      </div>
    </div>
  )
}

interface ShinAssistantProps {
  userType: "director" | "student" | "client"
  userName: string
  userEmail: string
  contextData?: {
    clinicId?: string
    clientId?: string
    studentId?: string
  }
}

export function ShinAssistant({ userType, userName, userEmail, contextData }: ShinAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: "/api/shin-assistant",
    body: {
      userType,
      userName,
      userEmail,
      contextData,
    },
    initialInput: "",
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      const scrollArea = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight
      }
    }
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const quickPrompts = [
    "What assignments are due this week?",
    "Show me recent debrief submissions",
    "What is the grading breakdown?",
    "Tell me about the SEED program",
  ]

  return (
    <>
      {/* Floating Chat Button - Always visible */}
      <Button
        onClick={() => setIsOpen(true)}
        style={{ zIndex: 9999 }}
        className={cn(
          "fixed bottom-6 right-6 w-16 h-16 rounded-full p-0 shadow-2xl",
          "bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500",
          "hover:scale-110 transition-all duration-300",
          "border-2 border-white/20",
          isOpen && "hidden",
        )}
        aria-label="Open SHIN Assistant"
      >
        <div className="relative">
          <ShinBridgeIcon className="w-9 h-9" />
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        </div>
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card
          style={{ zIndex: 9999 }}
          className={cn(
            "fixed bottom-6 right-6 w-[420px] h-[600px] shadow-2xl",
            "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950",
            "border border-white/10 rounded-2xl overflow-hidden",
            "animate-in slide-in-from-bottom-5 duration-300",
          )}
        >
          {/* Header */}
          <CardHeader className="p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShinBridgeIcon className="w-10 h-10" animate={isLoading} />
                  {isLoading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full blur-md opacity-40 animate-pulse" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    SHIN
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </CardTitle>
                  <p className="text-xs text-slate-400">SEED Intelligent Assistant</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="relative mb-6">
                    <ShinBridgeIcon className="w-20 h-20" animate={true} />
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-20" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Hello, {userName}!</h3>
                  <p className="text-sm text-slate-400 mb-6">
                    I'm SHIN, your SEED program assistant. I can help you with information about students, clients,
                    assignments, debriefs, and more.
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {quickPrompts.map((prompt, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInput(prompt)
                          setTimeout(() => {
                            const form = document.querySelector("form") as HTMLFormElement
                            if (form) form.requestSubmit()
                          }, 100)
                        }}
                        className="text-xs text-left h-auto py-2 px-3 bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {message.role === "assistant" && (
                        <div className="flex-shrink-0">
                          <ShinBridgeIcon className="w-7 h-7" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2.5",
                          message.role === "user"
                            ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
                            : "bg-white/10 text-slate-200",
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {message.role === "user" && (
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && <ThinkingIndicator />}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-slate-900/50">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input ?? ""}
                  onChange={handleInputChange}
                  placeholder="Ask SHIN anything..."
                  className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus-visible:ring-cyan-500"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !(input ?? "").trim()}
                  className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 text-white border-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-[10px] text-slate-500 mt-2 text-center">
                SHIN has access to SEED program data to assist you
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
