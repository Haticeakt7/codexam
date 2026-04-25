import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:       "var(--color-bg)",
        surface:  "var(--color-surface)",
        surface2: "var(--color-surface-2)",
        border:   "var(--color-border)",
        primary:  "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        text:     "var(--color-text)",
        muted:    "var(--color-text-muted)",
        danger:   "var(--color-danger)",
        success:  "var(--color-success)",
        warning:  "var(--color-warning)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
