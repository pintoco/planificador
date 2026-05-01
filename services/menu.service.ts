import { prisma } from '@/lib/db'
import {
  generarMenuSemanal,
  generarListaCompras,
  menuFallback,
  listaFallback,
  MenuSemanal,
  CategoriaCompras,
} from '@/lib/ai/claude'
import { getProfile } from './profile.service'
import { logger } from '@/lib/logger'

export async function generateAndSaveMenu(userId: string) {
  const profile = await getProfile(userId)
  if (!profile) throw new Error('Perfil no encontrado. Completa tu perfil primero.')

  let menuData: MenuSemanal
  let listaItems: CategoriaCompras[]
  let usedFallback = false

  try {
    logger.info('menu.generate.start', { userId })
    menuData = await generarMenuSemanal({
      objetivo: profile.objetivo,
      alergias: profile.alergias,
      preferencias: profile.preferencias,
      personas: profile.personas,
    })
    listaItems = await generarListaCompras(menuData, profile.personas)
    logger.info('menu.generate.success', { userId })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    logger.warn('menu.generate.fallback', { userId, metadata: { reason } })
    menuData = menuFallback()
    listaItems = listaFallback()
    usedFallback = true
  }

  await prisma.weeklyMenu.updateMany({
    where: { userId, activo: true },
    data: { activo: false },
  })

  const menu = await prisma.weeklyMenu.create({
    data: { userId, menu: menuData as object, activo: true },
  })

  const lista = await prisma.shoppingList.create({
    data: { userId, menuId: menu.id, items: listaItems as object },
  })

  logger.info('menu.saved', { userId, metadata: { menuId: menu.id, listaId: lista.id, usedFallback } })
  return { menu, lista, usedFallback }
}

export async function getActiveMenu(userId: string) {
  return prisma.weeklyMenu.findFirst({
    where: { userId, activo: true },
    orderBy: { createdAt: 'desc' },
    include: { shoppingList: true },
  })
}

export async function getMenuById(menuId: string, userId: string) {
  return prisma.weeklyMenu.findFirst({
    where: { id: menuId, userId },
    include: { shoppingList: true },
  })
}

export async function countMenusToday(userId: string): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  return prisma.weeklyMenu.count({
    where: { userId, createdAt: { gte: startOfDay } },
  })
}
