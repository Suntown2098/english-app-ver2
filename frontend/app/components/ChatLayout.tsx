"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import MainContent from "./MainContent"
import HistoryPanel from "./HistoryPanel"

export default function ChatLayout() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  return (
    <div className="flex h-screen bg-flappy-bg bg-cover bg-center">
      <Sidebar onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)} />
      <MainContent />
      <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  )
}
