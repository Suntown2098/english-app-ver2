"use client"
import { useConversation } from "../contexts/ConversationContext"
import { X } from "lucide-react"

type HistoryPanelProps = {
  isOpen: boolean
  onClose: () => void
}

// HistoryPanel.tsx
// Panel trượt phải hiển thị lịch sử hội thoại, cho phép chọn lại hội thoại cũ.
// Lấy dữ liệu từ context, hiển thị loading, đóng/mở panel.

export default function HistoryPanel({ isOpen, onClose }: HistoryPanelProps) {
  const { conversations, loadConversation, isLoading } = useConversation()

  // Format date for display
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Khi click vào nút History trong Sidebar thì hiển thị lịch sử hội thoại
  const handleConversationClick = (conversationId: string) => {
    loadConversation(conversationId)
    onClose()
  }

  return (
    // Collapse Panel bên phải, hiển thị danh sách hội thoại, nút đóng
    <div
      className={`fixed inset-y-0 right-0 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-20 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-300">
        <h2 className="text-lg flappy-text">Conversation History</h2>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100" aria-label="Close history panel">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto h-full pb-20">
        {isLoading ? (
          <p className="text-center py-4">Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="text-center py-4 text-gray-500">No conversation history</p>
        ) : (
          <ul className="space-y-2">
            {conversations.map((conversation) => (
              <li key={conversation.conversationid}>
                <button
                  onClick={() => handleConversationClick(conversation.conversationid)}
                  className="w-full text-left p-3 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <p className="font-medium truncate">Conversation</p>
                  <p className="text-sm text-gray-500">{formatDate(conversation.timestamp)}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
