import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx,mdx,js,jsx}",
    "./src/components/**/*.{ts,tsx,mdx,js,jsx}",
    "./src/lib/**/*.{ts,tsx,mdx,js,jsx}",
    "./src/pages/**/*.{ts,tsx,mdx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)" },
        secondary: { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        destructive: { DEFAULT: "var(--destructive)", foreground: "var(--destructive-foreground)" },
        muted: "var(--muted)",
        subtle: "var(--subtle)",
        accent: "var(--accent)",
        success: "var(--success)",
      },
      fontFamily: {
        sans: ["InterVariable", "Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
}

export default config
