"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import MainContent from "./MainContent"
import HistoryPanel from "./HistoryPanel"

// ChatLayout.tsx
// Component layout tổng cho trang chat: kết hợp Sidebar, MainContent và HistoryPanel.
// Quản lý trạng thái mở/đóng panel lịch sử hội thoại.

export default function ChatLayout() {
  // isHistoryOpen: trạng thái mở/đóng panel lịch sử hội thoại
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  return (
    // Bố cục flex: Sidebar | MainContent | HistoryPanel
    <div className="flex h-screen bg-flappy-bg bg-cover bg-center">
      <Sidebar onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)} />
      <MainContent />
      <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  )
}
