import { NextResponse } from 'next/server'

// Respuesta de error consistente — no expone internals en 5xx
export function apiError(message: string, status: number, logContext?: string): NextResponse {
  if (logContext) {
    console.error(`[${logContext}] ${status >= 500 ? message : '(validation error)'} status=${status}`)
  }
  const body = status >= 500
    ? { error: 'Error interno del servidor. Intenta de nuevo.' }
    : { error: message }
  return NextResponse.json(body, { status })
}
