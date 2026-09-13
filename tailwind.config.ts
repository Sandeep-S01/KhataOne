import type { Config } from "tailwindcss";

const rgbVar = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: rgbVar("--background-rgb"),
        foreground: rgbVar("--foreground-rgb"),
        surface: rgbVar("--surface-rgb"),
        "surface-muted": rgbVar("--surface-muted-rgb"),
        primary: rgbVar("--primary-rgb"),
        "primary-dark": rgbVar("--primary-dark-rgb"),
        saffron: rgbVar("--saffron-rgb"),
        ink: rgbVar("--ink-rgb"),
        success: rgbVar("--success-rgb"),
        "success-foreground": rgbVar("--success-foreground-rgb"),
        warning: rgbVar("--warning-rgb"),
        "warning-foreground": rgbVar("--warning-foreground-rgb"),
        info: rgbVar("--info-rgb"),
        "info-foreground": rgbVar("--info-foreground-rgb"),
        destructive: rgbVar("--destructive-rgb"),
        "destructive-foreground": rgbVar("--destructive-foreground-rgb"),
        border: rgbVar("--border-rgb"),
        input: rgbVar("--input-rgb"),
        ring: rgbVar("--ring-rgb"),
        khata: {
          paper: rgbVar("--background-rgb"),
          paperMuted: rgbVar("--surface-muted-rgb"),
          surface: rgbVar("--surface-rgb"),
          ink: rgbVar("--foreground-rgb"),
          muted: rgbVar("--muted-foreground-rgb"),
          border: rgbVar("--border-rgb"),
          green: rgbVar("--primary-rgb"),
          greenDark: rgbVar("--primary-dark-rgb"),
          saffron: rgbVar("--saffron-rgb"),
          blue: rgbVar("--info-rgb"),
          danger: rgbVar("--destructive-rgb"),
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Sora", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "0.25rem",
        md: "var(--radius)",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      boxShadow: {
        xs: "var(--elev-1)",
        sm: "var(--elev-1)",
        md: "var(--elev-2)",
        lg: "var(--elev-3)",
        ledger: "var(--elev-2)",
      },
    },
  },
  plugins: [],
};

export default config;
