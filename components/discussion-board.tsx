"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Send, Pin, ChevronDown, ChevronUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface DiscussionPost {
  id: string
  title: string
  content: string
  author_name: string
  author_email: string
  author_type: "student" | "director" | "client"
  is_pinned: boolean
  created_at: string
  replies: DiscussionReply[]
  attachments?: { name: string; url: string }[]
}

interface DiscussionReply {
  id: string
  content: string
  author_name: string
  author_email: string
  author_type: "student" | "director" | "client"
  created_at: string
  attachments?: { name: string; url: string }[]
}

interface DiscussionBoardProps {
  contextType: "client" | "clinic"
  contextId: string
  currentUser: {
    name: string
    email: string
    type: "student" | "director" | "client"
  }
  title?: string
  description?: string
}

export function DiscussionBoard({
  contextType,
  contextId,
  currentUser,
  title = "Discussion Board",
  description = "General discussions and updates",
}: DiscussionBoardProps) {
  const [posts, setPosts] = useState<DiscussionPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostContent, setNewPostContent] = useState("")
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [contextType, contextId])

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/discussions?contextType=${contextType}&contextId=${contextId}`)
      const data = await res.json()
      if (data.posts) {
        setPosts(data.posts)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitPost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contextType,
          contextId,
          title: newPostTitle,
          content: newPostContent,
          authorName: currentUser.name,
          authorEmail: currentUser.email,
          authorType: currentUser.type,
        }),
      })
      if (res.ok) {
        setNewPostTitle("")
        setNewPostContent("")
        setShowNewPost(false)
        fetchPosts()
      }
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (postId: string) => {
    const text = replyText[postId]?.trim()
    if (!text) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/discussions/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          content: text,
          authorName: currentUser.name,
          authorEmail: currentUser.email,
          authorType: currentUser.type,
        }),
      })
      if (res.ok) {
        setReplyText((prev) => ({ ...prev, [postId]: "" }))
        fetchPosts()
      }
    } catch (error) {
      console.error("Error adding reply:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const getAuthorBadge = (type: string) => {
    switch (type) {
      case "director":
        return <Badge className="bg-purple-100 text-purple-700 text-xs">Director</Badge>
      case "client":
        return <Badge className="bg-blue-100 text-blue-700 text-xs">Client</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 text-xs">Student</Badge>
    }
  }

  const pinnedPosts = posts.filter((p) => p.is_pinned)
  const regularPosts = posts.filter((p) => !p.is_pinned)

  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-lg">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowNewPost(!showNewPost)} className="bg-slate-700 hover:bg-slate-800">
            New Post
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Post Form */}
        {showNewPost && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <Input
              placeholder="Post title..."
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              className="bg-white"
            />
            <Textarea
              placeholder="Write your post..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="bg-white min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowNewPost(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitPost}
                disabled={submitting || !newPostTitle.trim() || !newPostContent.trim()}
              >
                <Send className="h-4 w-4 mr-1" />
                Post
              </Button>
            </div>
          </div>
        )}

        {/* Pinned Posts */}
        {pinnedPosts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <Pin className="h-3 w-3" /> Pinned
            </p>
            {pinnedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                expanded={expandedPost === post.id}
                onToggle={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                replyText={replyText[post.id] || ""}
                onReplyChange={(text) => setReplyText((prev) => ({ ...prev, [post.id]: text }))}
                onSubmitReply={() => handleSubmitReply(post.id)}
                submitting={submitting}
                getAuthorBadge={getAuthorBadge}
              />
            ))}
          </div>
        )}

        {/* Regular Posts */}
        <div className="space-y-2">
          {regularPosts.length === 0 && pinnedPosts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No discussions yet</p>
              <p className="text-xs text-slate-400 mt-1">Start a conversation!</p>
            </div>
          ) : (
            regularPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                expanded={expandedPost === post.id}
                onToggle={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                replyText={replyText[post.id] || ""}
                onReplyChange={(text) => setReplyText((prev) => ({ ...prev, [post.id]: text }))}
                onSubmitReply={() => handleSubmitReply(post.id)}
                submitting={submitting}
                getAuthorBadge={getAuthorBadge}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PostCard({
  post,
  expanded,
  onToggle,
  replyText,
  onReplyChange,
  onSubmitReply,
  submitting,
  getAuthorBadge,
}: {
  post: DiscussionPost
  expanded: boolean
  onToggle: () => void
  replyText: string
  onReplyChange: (text: string) => void
  onSubmitReply: () => void
  submitting: boolean
  getAuthorBadge: (type: string) => React.ReactNode
}) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="p-4 bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={onToggle}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-slate-900">{post.title}</h4>
              {post.is_pinned && <Pin className="h-3 w-3 text-amber-500" />}
            </div>
            <p className="text-sm text-slate-600 line-clamp-2">{post.content}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-[8px]">
                    {post.author_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {post.author_name}
              </span>
              {getAuthorBadge(post.author_type)}
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              {post.replies.length > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {post.replies.length}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-4">
          {/* Full Content */}
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Replies */}
          {post.replies.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Replies</p>
              {post.replies.map((reply) => (
                <div key={reply.id} className="p-3 bg-white rounded-lg border border-slate-200 ml-4">
                  <div className="flex items-center gap-2 mb-2 text-xs">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[8px]">
                        {reply.author_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{reply.author_name}</span>
                    {getAuthorBadge(reply.author_type)}
                    <span className="text-slate-400">
                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{reply.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Reply Form */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => onReplyChange(e.target.value)}
              className="flex-1 min-h-[60px] text-sm resize-none bg-white"
            />
            <Button
              size="sm"
              onClick={onSubmitReply}
              disabled={!replyText.trim() || submitting}
              className="bg-slate-700 hover:bg-slate-800"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
