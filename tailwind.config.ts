import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        'tree': 'tree-frames 1s steps(1) infinite',
        'subtle-glow': 'subtle-glow 2s ease-in-out infinite'
      },
      keyframes: {
        'tree-frames': {
          '0%': { opacity: '1' },
          '50%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'subtle-glow': {
          '0%, 100%': {
            boxShadow: '0 0 5px rgba(255, 255, 255, 0.2), 0 0 15px rgba(255, 255, 255, 0.1)'
          },
          '50%': {
            boxShadow: '0 0 15px rgba(255, 255, 255, 0.4), 0 0 30px rgba(255, 255, 255, 0.2)'
          }
        }
      },
    },
  },
  plugins: [],
} satisfies Config;
