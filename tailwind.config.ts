import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        khata: {
          paper: "#F7F5EF",
          paperMuted: "#F1EEE6",
          surface: "#FFFFFF",
          ink: "#1F2A24",
          muted: "#5F6B63",
          border: "#D8D2C4",
          green: "#146B43",
          greenDark: "#0D4B31",
          saffron: "#D98A1F",
          blue: "#2563A8",
          danger: "#B42318",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        ledger: "0 12px 32px rgba(31, 42, 36, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
