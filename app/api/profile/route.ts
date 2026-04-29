import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession, getOrCreateUser, applySessionCookie } from '@/lib/session'
import { saveProfile, getProfile } from '@/services/profile.service'
import { profileSchema } from '@/lib/validators/profile'
import { apiError } from '@/lib/errors'

export async function GET() {
  try {
    const user = await getUserFromSession()
    if (!user) return NextResponse.json({ profile: null })

    const profile = await getProfile(user.id)
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('[GET /api/profile]', error)
    return apiError('Error al obtener perfil', 500, 'GET /api/profile')
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = profileSchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Datos inválidos'
      return apiError(message, 400)
    }

    const { objetivo, alergias, preferencias, personas } = parsed.data
    const { user, sessionId, isNew } = await getOrCreateUser()

    const profile = await saveProfile(user.id, { objetivo, alergias, preferencias, personas })

    const response = NextResponse.json({ profile })
    if (isNew) applySessionCookie(response, sessionId)
    return response
  } catch (error) {
    console.error('[POST /api/profile]', error)
    return apiError('Error al guardar perfil', 500, 'POST /api/profile')
  }
}
