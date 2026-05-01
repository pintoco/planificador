import { NextResponse } from 'next/server'
import { getUserFromSession } from '@/lib/session'
import { generateAndSaveMenu, countMenusToday } from '@/services/menu.service'
import { apiError } from '@/lib/errors'
import { logger } from '@/lib/logger'

const DAILY_LIMIT = 5

export async function POST() {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return apiError('Sesión no encontrada. Completa tu perfil primero.', 401)
    }

    const todayCount = await countMenusToday(user.id)
    if (todayCount >= DAILY_LIMIT) {
      logger.warn('menu.rate_limit', { userId: user.id, metadata: { todayCount } })
      return apiError(`Límite diario alcanzado (${DAILY_LIMIT} menús por día). Vuelve mañana.`, 429)
    }

    logger.info('menu.generate.request', { userId: user.id })

    const { menu, lista, usedFallback } = await generateAndSaveMenu(user.id)

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
    logger.error('menu.generate.error', { metadata: { message } })
    return apiError(message, 500, 'POST /api/menu/generate')
  }
}
