import { NextResponse } from 'next/server'
import { getUserFromSession } from '@/lib/session'
import { getShoppingList } from '@/services/shopping-list.service'
import { apiError } from '@/lib/errors'

export async function GET() {
  try {
    const user = await getUserFromSession()
    if (!user) return NextResponse.json({ lista: null })

    const lista = await getShoppingList(user.id)
    return NextResponse.json({ lista })
  } catch (error) {
    console.error('[GET /api/shopping-list]', error)
    return apiError('Error al obtener lista', 500, 'GET /api/shopping-list')
  }
}
