/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/plugins/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter Variable", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        canvas: "var(--vms-canvas)",
        surface: {
          DEFAULT: "var(--vms-surface)",
          subtle: "var(--vms-surface-subtle)",
        },
        ink: {
          DEFAULT: "var(--vms-ink)",
          muted: "var(--vms-ink-muted)",
        },
        line: {
          DEFAULT: "var(--vms-line)",
          strong: "var(--vms-line-strong)",
        },
        action: {
          DEFAULT: "var(--vms-action)",
          hover: "var(--vms-action-hover)",
        },
        active: "var(--vms-active-accent)",
        data: {
          primary: "var(--vms-data-primary)",
          secondary: "var(--vms-data-secondary)",
          tertiary: "var(--vms-data-tertiary)",
        },
        success: {
          DEFAULT: "var(--vms-success)",
          subtle: "var(--vms-success-subtle)",
        },
        warning: {
          DEFAULT: "var(--vms-warning)",
          subtle: "var(--vms-warning-subtle)",
        },
        danger: {
          DEFAULT: "var(--vms-danger)",
          subtle: "var(--vms-danger-subtle)",
        },
        focus: "var(--vms-focus)",
        "on-action": "var(--vms-on-action)",
        border: "hsl(var(--border))",
        "brand-primary": "var(--brand-primary,#1e40af)",
        "brand-secondary": "var(--brand-secondary,#475569)",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
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
        sm: "var(--radius-sm)",
        xs: "var(--radius-xs)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        DEFAULT: "var(--radius)",
      },
    },
  },
  plugins: [],
};
