import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { getActiveMenu } from '@/services/menu.service'

const SESSION_COOKIE = 'planificador_session'

export async function GET() {
  try {
    const cookieStore = cookies()
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value

    if (!sessionId) {
      return NextResponse.json({ menu: null })
    }

    const user = await prisma.user.findUnique({ where: { sessionId } })
    if (!user) {
      return NextResponse.json({ menu: null })
    }

    const menu = await getActiveMenu(user.id)
    return NextResponse.json({ menu })
  } catch (error) {
    console.error('[GET /api/menu]', error)
    return NextResponse.json({ error: 'Error al obtener menú' }, { status: 500 })
  }
}
