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
        primary: {
          DEFAULT: "#0EA5E9", // Bleu OperaFlow
          dark: "#0284C7",
          light: "#38BDF8",
        },
        secondary: {
          DEFAULT: "#1F2937", // Gris anthracite
          light: "#374151",
          dark: "#111827",
        },
        accent: {
          DEFAULT: "#F97316", // Orange chantier
          dark: "#EA580C",
          light: "#FB923C",
        },
        background: {
          DEFAULT: "#F3F4F6", // Fond clair
          dark: "#E5E7EB",
        },
      },
      borderRadius: {
        card: "0.75rem", // Coins arrondis pour les cartes
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        cardHover: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;

