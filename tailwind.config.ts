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
        brand: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#7f1d1d",
          900: "#450a0a",
        },
      },
      boxShadow: {
        "pop-ink": "6px 6px 0 0 rgba(17,24,39,1)",
        "pop-brand": "6px 6px 0 0 rgba(220,38,38,1)",
      },
    },
  },
  plugins: [],
};

export default config;
