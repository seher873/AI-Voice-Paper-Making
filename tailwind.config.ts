import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#0f172a",
        primary: {
          DEFAULT: "#4f46e5",
          light: "#818cf8",
          dark: "#3730a3",
        },
        secondary: "#0ea5e9",
        accent: "#10b981",
        surface: "#f8fafc",
        border: "#e2e8f0",
        muted: "#94a3b8",
      },
      fontFamily: {
        urdu: ["Noto Nastaliq Urdu", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
