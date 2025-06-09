"use client"

import { useState } from "react"
import { Volume2 } from "lucide-react"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  audio?: Blob[]
  create_time: string
}

type MessageListProps = {
  messages: Message[]
}

export default function MessageList({ messages }: MessageListProps) {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)

  const playAudio = (message: Message) => {
    if (!message.audio || message.audio.length === 0) return

    // Stop any currently playing audio
    if (playingAudio === message.id) {
      setPlayingAudio(null)
      return
    }

    const audioBlob = new Blob(message.audio, { type: "audio/wav" })
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)

    audio.onended = () => {
      setPlayingAudio(null)
    }

    audio.play()
    setPlayingAudio(message.id)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="flappy-card text-center max-w-md">
          <h2 className="text-xl flappy-text mb-4">Welcome to Flappy English!</h2>
          <p className="mb-4">Start a conversation to practice your English speaking skills with our AI tutor.</p>
          <p className="text-sm text-gray-500">You can type a message or use the microphone to record your voice.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`${message.role === "user" ? "user-message" : "ai-message"} max-w-[80%] relative pixel-corners`}
          >
            <div className="mb-1">
              <span className="flappy-text text-xs">{message.role === "user" ? "You" : "AI Tutor"}</span>
            </div>
            <p className="whitespace-pre-wrap">{message.content}</p>

            {message.audio && message.role === "assistant" && (
              <button
                onClick={() => playAudio(message)}
                className={`mt-2 p-1 rounded-full ${
                  playingAudio === message.id ? "bg-primary text-white" : "bg-gray-200"
                }`}
                aria-label="Play audio"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            )}

            <div className="text-xs opacity-70 mt-1 text-right">{formatTime(message.create_time)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
