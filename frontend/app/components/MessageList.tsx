"use client"

import { useState, useRef, useEffect } from "react"
import { Volume2 } from "lucide-react"
import ReactDOM from "react-dom";
import { base64ToBlob } from "../lib/utils"

// Use the same Message type as ConversationContext, but audio is always base64 string
export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  audio?: string // base64 string
  create_time: string
}

type MessageListProps = {
  messages: Message[]
}

// MessageList.tsx
// Hiển thị danh sách tin nhắn trong hội thoại, hỗ trợ tra cứu từ điển, phát audio.
// Phân biệt tin nhắn user/AI, popup tra cứu từ, phát âm thanh.

export default function MessageList({ messages }: MessageListProps) {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [lookupWord, setLookupWord] = useState<string | null>(null)
  const [lookupResult, setLookupResult] = useState<any>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  // Hàm phát audio cho tin nhắn
  const playAudio = (message: Message) => {
    if (!message.audio) return

    // Stop any currently playing audio
    if (playingAudio === message.id) {
      setPlayingAudio(null)
      return
    }

    // Always treat audio as base64 string
    const audioBlob = base64ToBlob(message.audio, "audio/wav")
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)

    audio.onended = () => {
      setPlayingAudio(null)
      URL.revokeObjectURL(audioUrl)
    }

    audio.play()
    setPlayingAudio(message.id)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Hàm tra cứu từ điển khi click vào từ
  const lookupDictionary = async (word: string, event: React.MouseEvent) => {
    setLookupWord(word)
    setLookupResult(null)
    setLookupError(null)
    // Lấy vị trí chuột
    const mouseX = event.clientX
    const mouseY = event.clientY
    setPopupPos({ x: mouseX, y: mouseY })
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
      if (!res.ok) throw new Error("Not found")
      const data = await res.json()
      setLookupResult(data[0])
    } catch (err) {
      setLookupError("No definition found.")
    }
  }

  // Đóng popup khi click ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setLookupWord(null)
        setLookupResult(null)
        setLookupError(null)
      }
    }
    if (lookupWord) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [lookupWord])

  // Hàm tính toán vị trí popup không vượt khỏi viewport
  function getPopupStyle() {
    if (!popupPos) return {}
    const popupWidth = 320 // px
    const popupHeight = 180 // px (ước lượng)
    let left = popupPos.x
    let top = popupPos.y + 12 // cách chuột 1 chút
    // Nếu vượt phải màn hình
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 8
    }
    // Nếu vượt dưới màn hình
    if (top + popupHeight > window.innerHeight) {
      top = popupPos.y - popupHeight - 12
      if (top < 0) top = 8
    }
    return {
      left: left + 'px',
      top: top + 'px',
      position: 'fixed' as const,
      zIndex: 9999,
      maxWidth: popupWidth + 'px',
    }
  }

  // Hàm render từng từ có thể click để tra cứu
  function renderContentWithLookup(content: string) {
    return content.split(/(\s+)/).map((word, idx) => {
      // Bỏ qua khoảng trắng
      if (/^\s+$/.test(word)) return word
      // Bỏ ký tự đặc biệt khi tra cứu
      const cleanWord = word.replace(/[^a-zA-Z'-]/g, "")
      if (!cleanWord) return word
      return (
        <span
          key={idx}
          className="cursor-pointer hover:text-blue-600"
          onClick={e => lookupDictionary(cleanWord.toLowerCase(), e)}
        >
          {word}
        </span>
      )
    })
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
    // Hiển thị từng tin nhắn, popup tra cứu từ, nút phát audio
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`${message.role === "user" ? "user-message" : "ai-message"} max-w-[80%] relative pixel-corners`}
          >
            <div className="mb-1">
              <span className="flappy-text text-xs">{message.role === "user" ? "You" : "AI Tutor"}</span>
            </div>
            <p className="whitespace-pre-wrap">{renderContentWithLookup(message.content)}</p>

            {message.audio && message.audio.length > 0 && (
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

            {/* Popup tra cứu từ */}
            {lookupWord && popupPos && typeof window !== "undefined" && document.body &&
              ReactDOM.createPortal(
                <div
                  ref={popupRef}
                  style={getPopupStyle()}
                  className="bg-white border border-gray-300 rounded shadow-lg p-4 text-sm"
                >
                  <div className="font-bold mb-1 text-blue-700 flex items-center gap-2">
                    {lookupWord}
                    {/* Speaker icon */}
                    <button
                      type="button"
                      aria-label="Play pronunciation"
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        // Nếu API có audio, phát audio, nếu không dùng Web Speech API
                        const audioUrl = lookupResult?.phonetics?.find((p: any) => p.audio)?.audio
                        if (audioUrl) {
                          const audio = new Audio(audioUrl)
                          audio.play()
                        } else if (window.speechSynthesis) {
                          const utter = new window.SpeechSynthesisUtterance(lookupWord)
                          utter.lang = 'en-US'
                          window.speechSynthesis.speak(utter)
                        }
                      }}
                    >
                      <Volume2 className="inline h-5 w-5" />
                    </button>
                  </div>
                  {lookupError && <div className="text-red-500">{lookupError}</div>}
                  {lookupResult && (
                    <div>
                      <div className="mb-1">
                        <span className="italic text-gray-600">{lookupResult.meanings?.[0]?.partOfSpeech}</span>
                      </div>
                      <div className="mb-1">
                        <span className="font-semibold">Definition:</span> {lookupResult.meanings?.[0]?.definitions?.[0]?.definition}
                      </div>
                      {lookupResult.meanings?.[0]?.definitions?.[0]?.example && (
                        <div className="mb-1">
                          <span className="font-semibold">Example:</span> <span className="italic">{lookupResult.meanings[0].definitions[0].example}</span>
                        </div>
                      )}
                      {lookupResult.phonetic && (
                        <div className="text-gray-500">Phonetic: {lookupResult.phonetic}</div>
                      )}
                    </div>
                  )}
                </div>,
                document.body
              )
            }

            {/* <div className="text-xs opacity-70 mt-1 text-right">{formatTime(message.create_time)}</div> */}
          </div>
        </div>
      ))}
    </div>
  )
}
