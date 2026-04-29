import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from './db'

export const SESSION_COOKIE = 'planificador_session'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 365,
  path: '/',
} as const

// Para POST routes: crea usuario si no existe, indica si la sesión es nueva
export async function getOrCreateUser() {
  const cookieStore = cookies()
  const existing = cookieStore.get(SESSION_COOKIE)?.value
  const sessionId = existing ?? crypto.randomUUID()
  const isNew = !existing

  const user = await prisma.user.upsert({
    where: { sessionId },
    update: {},
    create: { sessionId },
  })

  return { user, sessionId, isNew }
}

// Para GET routes: solo lee sesión existente, no crea nada
export async function getUserFromSession() {
  const cookieStore = cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionId) return null

  return prisma.user.findUnique({ where: { sessionId } })
}

// Aplica la cookie de sesión a una respuesta
export function applySessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set(SESSION_COOKIE, sessionId, COOKIE_OPTIONS)
  return response
}
