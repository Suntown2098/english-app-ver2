"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { X } from "lucide-react"

type SettingsModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState(user?.username || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!displayName.trim()) {
      setError("Display name cannot be empty")
      return
    }

    setIsLoading(true)

    try {
      // This would be an API call in a real application
      // For now, we'll just simulate success
      await new Promise((resolve) => setTimeout(resolve, 500))
      setSuccess("Display name updated successfully")
    } catch (err) {
      setError("Failed to update display name")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      // This would be an API call in a real application
      // For now, we'll just simulate success
      await new Promise((resolve) => setTimeout(resolve, 500))
      setSuccess("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setError("Failed to update password")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 flappy-card">
        <div className="flex items-center justify-between p-4 border-b border-gray-300">
          <h2 className="text-lg flappy-text">Settings</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100" aria-label="Close settings">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

          {success && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded-md text-sm">{success}</div>}

          <form onSubmit={handleUpdateDisplayName} className="mb-6">
            <h3 className="flappy-text mb-3">Update Display Name</h3>
            <div className="mb-4">
              <label htmlFor="displayName" className="block mb-2 text-sm">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                className="flappy-input w-full"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <button type="submit" className="flappy-button w-full" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Display Name"}
            </button>
          </form>

          <form onSubmit={handleUpdatePassword}>
            <h3 className="flappy-text mb-3">Change Password</h3>
            <div className="mb-4">
              <label htmlFor="currentPassword" className="block mb-2 text-sm">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                className="flappy-input w-full"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="newPassword" className="block mb-2 text-sm">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                className="flappy-input w-full"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block mb-2 text-sm">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="flappy-input w-full"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <button type="submit" className="flappy-button w-full" disabled={isLoading}>
              {isLoading ? "Updating..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
