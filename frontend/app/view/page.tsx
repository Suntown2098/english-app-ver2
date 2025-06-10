"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../contexts/AuthContext"
import { ConversationProvider } from "../contexts/ConversationContext"
import ChatLayout from "../components/ChatLayout"

export default function ChatPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-flappy-bg bg-cover bg-center">
        <div className="flappy-card p-8">
          <p className="font-flappy text-center">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <ConversationProvider>
      <ChatLayout />
    </ConversationProvider>
  )
}
