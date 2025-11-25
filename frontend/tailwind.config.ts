/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "theme-primary": "var(--theme-primary)",
        "theme-secondary": "var(--theme-secondary)",
        "theme-primary-foreground": "var(--theme-primary-foreground)",
        "theme-secondary-foreground": "var(--theme-secondary-foreground)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
        heading: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};