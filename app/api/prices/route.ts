import { NextRequest, NextResponse } from 'next/server'
import { compareProducts } from '@/services/price-comparator.service'
import { apiError } from '@/lib/errors'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const itemsParam = searchParams.get('items')

    if (!itemsParam) {
      return apiError('Parámetro "items" requerido. Ej: /api/prices?items=arroz,pollo,leche', 400)
    }

    const productos = itemsParam
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, 30) // máximo 30 productos por request

    if (productos.length === 0) {
      return apiError('Lista de productos vacía', 400)
    }

    const comparaciones = compareProducts(productos)
    const encontrados = comparaciones.filter((c) => c.precios.length > 0).length

    return NextResponse.json({
      comparaciones,
      resumen: {
        total: productos.length,
        encontrados,
        noEncontrados: productos.length - encontrados,
        ahorroTotal: comparaciones.reduce((acc, c) => acc + c.ahorro, 0),
      },
      fuente: 'mock',
      nota: 'Precios aproximados en CLP. Fase 2 implementará scraping en tiempo real.',
    })
  } catch (error) {
    return apiError('Error al comparar precios', 500, 'GET /api/prices')
  }
}
