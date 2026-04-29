import { prisma } from '@/lib/db'

export async function getShoppingList(userId: string) {
  const menu = await prisma.weeklyMenu.findFirst({
    where: { userId, activo: true },
    orderBy: { createdAt: 'desc' },
    include: { shoppingList: true },
  })
  return menu?.shoppingList ?? null
}

export async function toggleItemCompleted(listId: string, userId: string, completed: boolean) {
  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, userId },
  })
  if (!list) throw new Error('Lista no encontrada')

  return prisma.shoppingList.update({
    where: { id: listId },
    data: { completado: completed },
  })
}
