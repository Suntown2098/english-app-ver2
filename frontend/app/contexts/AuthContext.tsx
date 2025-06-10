"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

type User = {
  userid: string
  username: string
  token: string
}

type AuthContextType = {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  signup: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// AuthContext.tsx
// Context quản lý xác thực người dùng: đăng nhập, đăng ký, đăng xuất, lưu user vào cookie, kiểm tra trạng thái đăng nhập.
// Cung cấp các hàm login, signup, logout, trạng thái user, loading, error cho toàn app.

export function AuthProvider({ children }: { children: ReactNode }) {
  // user: thông tin người dùng hiện tại
  // isLoading: trạng thái loading khi xác thực
  // error: thông báo lỗi xác thực
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Khi load app, kiểm tra user đã đăng nhập chưa (lưu trong cookie)
    const storedUser = Cookies.get("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        Cookies.remove("user")
      }
    }
    setIsLoading(false)
  }, [])

  // Hàm đăng nhập
  const login = async (username: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Login failed")
      }

      const userData = await response.json()
      const userWithUsername = {
        ...userData,
        username,
      }

      // Store user data in cookies
      Cookies.set("user", JSON.stringify(userWithUsername), { expires: 7 })
      setUser(userWithUsername)
      router.push("/chat")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Hàm đăng ký
  const signup = async (username: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Signup failed")
      }

      const userData = await response.json()
      const userWithUsername = {
        ...userData,
        username,
      }

      // Store user data in cookies
      Cookies.set("user", JSON.stringify(userWithUsername), { expires: 7 })
      setUser(userWithUsername)
      router.push("/chat")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Hàm đăng xuất
  const logout = () => {
    Cookies.remove("user")
    setUser(null)
    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading, error }}>{children}</AuthContext.Provider>
  )
}

// Hook sử dụng AuthContext trong các component
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
