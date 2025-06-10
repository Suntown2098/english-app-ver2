"use client"

import type React from "react"
import { v4 as uuidv4 } from "uuid"
import { useState, useRef, useEffect } from "react"
import { useConversation } from "../contexts/ConversationContext"
import { Mic, Send, StopCircle } from "lucide-react"
import MessageList from "./MessageList"
import type { Message } from "../contexts/ConversationContext"
import { blobToBase64, base64ToBlob } from "../lib/utils"

// MainContent.tsx
// Vùng hiển thị nội dung chat chính: nhập/gửi tin nhắn, ghi âm, hiển thị hội thoại.
// Quản lý trạng thái nhập liệu, ghi âm, gửi tin nhắn qua context.

export default function MainContent() {
  // messageText: nội dung tin nhắn đang nhập
  const [messageText, setMessageText] = useState("")
  // isRecording: trạng thái ghi âm
  const [isRecording, setIsRecording] = useState(false)
  // recordingTime: thời gian ghi âm
  const [recordingTime, setRecordingTime] = useState(0)
  const { sendTextMessage, transcribeAudio, currentConversationMessages, isLoading } = useConversation()

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentConversationMessages])

  // Khi gửi tin nhắn văn bản
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (messageText.trim() && !isLoading) {
      // Set message with new ID and timestamp
      const newMessage: Message = {
        id: uuidv4(),
        role: "user",
        content: messageText.trim(),
        audio: "",
        create_time: new Date().toISOString()
      }

      // Send the message
      sendTextMessage(newMessage)
      
      // Reset message text
      setMessageText("")
    }
  }

  // Bắt đầu ghi âm
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)

      // Start timer
      setRecordingTime(0)
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 300)
    } catch (err) {
      console.error("Error accessing microphone:", err)
    }
  }

  // Kết thúc ghi âm, gửi audio lên server để chuyển thành text
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()

      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setIsRecording(false)

      // Process recording after a short delay to ensure all data is collected
      setTimeout(async () => {
        if (audioChunksRef.current.length > 0) {
          const mergedBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
          const audioBase64 = await blobToBase64(mergedBlob)
          const text = await transcribeAudio(audioChunksRef.current)
          const newMessage: Message = {
            id: uuidv4(),
            role: "user",
            content: text,
            audio: audioBase64,
            create_time: new Date().toISOString()
          }
          sendTextMessage(newMessage)
          audioChunksRef.current = []
        }
      }, 200)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    // Bố cục gồm vùng hiển thị tin nhắn và form nhập/gửi/ghi âm
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={currentConversationMessages} />
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-300 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center">
          {isRecording ? (
            <div className="flex items-center mr-3 text-red-500">
              <span className="animate-pulse mr-2">●</span>
              <span className="flappy-text text-sm">{formatTime(recordingTime)}</span>
            </div>
          ) : null}

          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            className="flappy-input flex-1 mr-2"
            disabled={isRecording || isLoading}
          />

          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              disabled={isLoading}
            >
              <StopCircle className="h-6 w-6" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="p-2 rounded-full bg-primary text-white hover:bg-green-600 transition-colors mr-2"
              disabled={isLoading}
            >
              <Mic className="h-6 w-6" />
            </button>
          )}

          <button
            type="submit"
            className="p-2 rounded-full bg-primary text-white hover:bg-green-600 transition-colors"
            disabled={!messageText.trim() || isLoading || isRecording}
          >
            <Send className="h-6 w-6" />
          </button>
        </form>
      </div>
    </div>
  )
}
