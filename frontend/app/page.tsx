"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "./contexts/AuthContext"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function Home() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [formError, setFormError] = useState("")
  const { login, signup, isLoading, error, user } = useAuth()
  const router = useRouter()

  // Handle navigation when user state changes
  useEffect(() => {
    if (user) {
      router.push("/view")
    }
  }, [user, router])

  // Reset error when switching tabs
  useEffect(() => {
    setFormError("");
  }, [isLogin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    if (!username || !password) {
      setFormError("Username and password are required")
      return
    }

    if (!isLogin && password !== confirmPassword) {
      setFormError("Passwords do not match")
      return
    }

    try {
      if (isLogin) {
        await login(username, password)
      } else {
        await signup(username, password)
      }
    } catch (err) {
      console.error("Authentication error:", err)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-flappy-bg bg-cover bg-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Image src="/ab.webp" alt="Flappy English" width={200} height={100} className="mb-4" />
          <h1 className="text-3xl flappy-text text-center text-primary-foreground">Flappy English</h1>
          <p className="mt-2 text-center text-white flappy-text text-sm">Practice English with AI</p>
        </div>

        <div className="flappy-card pixel-corners">
          <div className="flex mb-6">
            <button
              className={`flex-1 py-2 flappy-text text-sm ${isLogin ? "text-primary border-b-2 border-primary" : "text-gray-500"}`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={`flex-1 py-2 flappy-text text-sm ${!isLogin ? "text-primary border-b-2 border-primary" : "text-gray-500"}`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="block mb-2 flappy-text">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="flappy-input w-full"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block mb-2 flappy-text">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="flappy-input w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {!isLogin && (
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block mb-2 flappy-text">
                  Confirm Password
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
            )}

            {(formError || error) && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">{formError || error}</div>
            )}

            <button type="submit" className="flappy-button w-full mt-4" disabled={isLoading}>
              {isLoading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
