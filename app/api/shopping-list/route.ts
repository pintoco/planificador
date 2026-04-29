import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { getShoppingList } from '@/services/shopping-list.service'

const SESSION_COOKIE = 'planificador_session'

export async function GET() {
  try {
    const cookieStore = cookies()
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value

    if (!sessionId) {
      return NextResponse.json({ lista: null })
    }

    const user = await prisma.user.findUnique({ where: { sessionId } })
    if (!user) {
      return NextResponse.json({ lista: null })
    }

    const lista = await getShoppingList(user.id)
    return NextResponse.json({ lista })
  } catch (error) {
    console.error('[GET /api/shopping-list]', error)
    return NextResponse.json({ error: 'Error al obtener lista' }, { status: 500 })
  }
}
