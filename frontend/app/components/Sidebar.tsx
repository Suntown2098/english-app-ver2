"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useConversation } from "../contexts/ConversationContext"
import { MessageSquarePlus, History, Settings, LogOut } from "lucide-react"
import SettingsModal from "./SettingsModal"

type SidebarProps = {
  onToggleHistory: () => void
}

export default function Sidebar({ onToggleHistory }: SidebarProps) {
  const { user, logout } = useAuth()
  const { startNewConversation } = useConversation()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleNewConversation = () => {
    startNewConversation()
  }

  return (
    <div className="w-16 md:w-64 bg-white border-r border-gray-300 flex flex-col h-full">
      <div className="p-4 border-b border-gray-300">
        <h1 className="text-lg flappy-text text-primary hidden md:block">Flappy English</h1>
        <h1 className="text-lg flappy-text text-primary md:hidden">FE</h1>
      </div>

      <div className="flex-1 p-2">
        <button
          onClick={handleNewConversation}
          className="flex items-center w-full p-3 mb-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <MessageSquarePlus className="h-6 w-6 text-primary" />
          <span className="ml-3 flappy-text text-sm hidden md:block">New Chat</span>
        </button>

        <button
          onClick={onToggleHistory}
          className="flex items-center w-full p-3 mb-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <History className="h-6 w-6 text-primary" />
          <span className="ml-3 flappy-text text-sm hidden md:block">History</span>
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center w-full p-3 mb-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Settings className="h-6 w-6 text-primary" />
          <span className="ml-3 flappy-text text-sm hidden md:block">Settings</span>
        </button>
      </div>

      <div className="p-4 border-t border-gray-300">
        <div className="flex items-center justify-between">
          <div className="hidden md:block">
            <p className="text-sm flappy-text truncate">{user?.username}</p>
          </div>
          <button onClick={logout} className="p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Logout">
            <LogOut className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}
