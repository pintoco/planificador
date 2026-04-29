import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { generateAndSaveMenu } from '@/services/menu.service'

const SESSION_COOKIE = 'planificador_session'

export async function POST() {
  try {
    const cookieStore = cookies()
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'Sesión no encontrada. Completa tu perfil primero.' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { sessionId } })
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    console.log('[POST /api/menu/generate] Iniciando generación para user:', user.id)
    const { menu, lista } = await generateAndSaveMenu(user.id)

    return NextResponse.json({
      menuId: menu.id,
      listaId: lista.id,
      menu: menu.menu,
      message: 'Menú generado exitosamente',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[POST /api/menu/generate]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
