import { NextResponse } from 'next/server'

// Générer un favicon minimal en SVG converti en ICO
// Pour l'instant, on redirige vers le SVG
export async function GET() {
  // Redirection vers le SVG pour compatibilité
  return NextResponse.redirect('/favicon.svg', 301)
}

