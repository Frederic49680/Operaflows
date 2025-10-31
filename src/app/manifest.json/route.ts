import { NextResponse } from "next/server";

export async function GET() {
  const manifest = {
    name: "OperaFlow",
    short_name: "OperaFlow",
    description: "Application de suivi, planification et pilotage d'activités de terrain",
    start_url: "/",
    display: "standalone",
    background_color: "#F3F4F6",
    theme_color: "#0EA5E9",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };

  return NextResponse.json(manifest, {
    status: 200,
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

