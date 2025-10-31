import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SafeHeader from "@/components/layout/SafeHeader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OperaFlow - Planification et pilotage d'activités",
  description: "Application de suivi, planification et pilotage d'activités de terrain",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

// Gérer les erreurs dans Header pour éviter les crashes
function SafeHeader() {
  try {
    return <Header />;
  } catch (error) {
    console.error("Erreur Header:", error);
    return null;
  }
}

export const viewport: Viewport = {
  themeColor: "#0EA5E9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <SafeHeader />
        {children}
      </body>
    </html>
  );
}

