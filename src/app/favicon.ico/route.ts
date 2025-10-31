import { NextResponse } from 'next/server'

// Retourner un SVG comme favicon pour compatibilité
export async function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#0EA5E9" rx="10"/>
  <text x="50" y="70" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle">O</text>
</svg>`
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}

