import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { AuthProvider } from "./contexts/AuthContext"

export const metadata: Metadata = {
  title: "Flappy English - Practice English with AI",
  description: "Improve your English speaking skills with AI-powered conversations",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
