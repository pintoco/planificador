import { NextResponse } from 'next/server'
import { getUserFromSession } from '@/lib/session'
import { generateAndSaveMenu } from '@/services/menu.service'
import { apiError } from '@/lib/errors'

export async function POST() {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return apiError('Sesión no encontrada. Completa tu perfil primero.', 401)
    }

    console.log('[POST /api/menu/generate] Iniciando generación para user:', user.id)

    const { menu, lista, usedFallback } = await generateAndSaveMenu(user.id)

    console.log('[POST /api/menu/generate] Completado menuId:', menu.id, 'fallback:', usedFallback)

    return NextResponse.json({
      menuId: menu.id,
      listaId: lista.id,
      menu: menu.menu,
      usedFallback,
      message: usedFallback
        ? 'Menú generado con plantilla básica (IA no disponible temporalmente)'
        : 'Menú generado exitosamente',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[POST /api/menu/generate]', message)
    return apiError(message, 500, 'POST /api/menu/generate')
  }
}
