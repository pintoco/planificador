import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { saveProfile, getProfile } from '@/services/profile.service'

const SESSION_COOKIE = 'planificador_session'

async function resolveUser() {
  const cookieStore = cookies()
  let sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionId) sessionId = crypto.randomUUID()

  const user = await prisma.user.upsert({
    where: { sessionId },
    update: {},
    create: { sessionId },
  })
  return { user, sessionId }
}

export async function GET() {
  try {
    const { user } = await resolveUser()
    const profile = await getProfile(user.id)
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('[GET /api/profile]', error)
    return NextResponse.json({ error: 'Error al obtener perfil' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { objetivo, alergias, preferencias, personas } = body

    if (!objetivo) {
      return NextResponse.json({ error: 'El objetivo es requerido' }, { status: 400 })
    }
    if (!personas || personas < 1) {
      return NextResponse.json({ error: 'El número de personas debe ser mayor a 0' }, { status: 400 })
    }

    const { user, sessionId } = await resolveUser()
    const profile = await saveProfile(user.id, {
      objetivo,
      alergias: Array.isArray(alergias) ? alergias : [],
      preferencias: Array.isArray(preferencias) ? preferencias : [],
      personas: Number(personas),
    })

    const response = NextResponse.json({ profile, sessionId })
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('[POST /api/profile]', error)
    return NextResponse.json({ error: 'Error al guardar perfil' }, { status: 500 })
  }
}
