import { prisma } from '@/lib/db'
import { generarMenuSemanal, generarListaCompras, MenuSemanal } from '@/lib/ai/claude'
import { getProfile } from './profile.service'

export async function generateAndSaveMenu(userId: string) {
  const profile = await getProfile(userId)
  if (!profile) throw new Error('Perfil no encontrado. Completa tu perfil primero.')

  console.log('[menu.service] Generando menú para userId:', userId)

  const menuData = await generarMenuSemanal({
    objetivo: profile.objetivo,
    alergias: profile.alergias,
    preferencias: profile.preferencias,
    personas: profile.personas,
  })

  await prisma.weeklyMenu.updateMany({
    where: { userId, activo: true },
    data: { activo: false },
  })

  const menu = await prisma.weeklyMenu.create({
    data: {
      userId,
      menu: menuData as object,
      activo: true,
    },
  })

  const listaItems = await generarListaCompras(menuData, profile.personas)

  const lista = await prisma.shoppingList.create({
    data: {
      userId,
      menuId: menu.id,
      items: listaItems as object,
    },
  })

  console.log('[menu.service] Menú generado:', menu.id, '| Lista:', lista.id)
  return { menu, lista }
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
