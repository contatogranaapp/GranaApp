// src/middleware.ts
// Middleware simples — sem dependência de next/headers ou auth-helpers

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Apenas passa a requisição adiante.
  // A verificação de auth é feita em cada layout.tsx via createServerClient()
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
