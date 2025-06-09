import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#5EE270", // Flappy Bird green
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#FFD700", // Flappy Bird gold
          foreground: "#000000",
        },
        destructive: {
          DEFAULT: "#FF6B6B", // Red for errors
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F5F5F5",
          foreground: "#71717A",
        },
        accent: {
          DEFAULT: "#4DABF7", // Flappy Bird blue sky
          foreground: "#FFFFFF",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "flappy-bg": "url('/images/flappy-background.png')",
      },
      fontFamily: {
        flappy: ["'Courier New'", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
