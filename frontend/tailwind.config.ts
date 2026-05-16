import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:              "rgb(var(--color-bg) / <alpha-value>)",
        surface:         "rgb(var(--color-surface) / <alpha-value>)",
        surface2:        "rgb(var(--color-surface-2) / <alpha-value>)",
        border:          "rgb(var(--color-border) / <alpha-value>)",
        primary:         "rgb(var(--color-primary) / <alpha-value>)",
        "primary-hover": "rgb(var(--color-primary-hover) / <alpha-value>)",
        text:            "rgb(var(--color-text) / <alpha-value>)",
        muted:           "rgb(var(--color-text-muted) / <alpha-value>)",
        danger:          "rgb(var(--color-danger) / <alpha-value>)",
        success:         "rgb(var(--color-success) / <alpha-value>)",
        warning:         "rgb(var(--color-warning) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
