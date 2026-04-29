import { cookies } from 'next/headers'
import { prisma } from './db'

const SESSION_COOKIE = 'planificador_session'

export async function getOrCreateUser() {
  const cookieStore = cookies()
  let sessionId = cookieStore.get(SESSION_COOKIE)?.value

  if (!sessionId) {
    sessionId = crypto.randomUUID()
  }

  const user = await prisma.user.upsert({
    where: { sessionId },
    update: {},
    create: { sessionId },
  })

  return { user, sessionId }
}

export function getSessionId(): string | undefined {
  const cookieStore = cookies()
  return cookieStore.get(SESSION_COOKIE)?.value
}
