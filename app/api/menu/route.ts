import { NextResponse } from 'next/server'
import { getUserFromSession } from '@/lib/session'
import { getActiveMenu } from '@/services/menu.service'
import { apiError } from '@/lib/errors'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const user = await getUserFromSession()
    if (!user) return NextResponse.json({ menu: null })

    const menu = await getActiveMenu(user.id)
    return NextResponse.json({ menu })
  } catch (error) {
    logger.error('menu.get.error', { metadata: { message: error instanceof Error ? error.message : String(error) } })
    return apiError('Error al obtener menú', 500, 'GET /api/menu')
  }
}
