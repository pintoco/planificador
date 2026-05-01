import { NextRequest, NextResponse } from 'next/server'
import { compareProductsAsync } from '@/services/price-comparator.service'
import { apiError } from '@/lib/errors'
import { logger } from '@/lib/logger'

const MAX_ITEMS = 20

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
      .slice(0, MAX_ITEMS)

    if (productos.length === 0) {
      return apiError('Lista de productos vacía', 400)
    }

    logger.info('prices.request', { metadata: { count: productos.length } })

    const resultado = await compareProductsAsync(productos)
    const encontrados = resultado.comparaciones.filter((c) => c.precios.length > 0).length

    return NextResponse.json({
      comparaciones: resultado.comparaciones,
      totalPorSuper: resultado.totalPorSuper,
      mejorOpcion: resultado.mejorOpcion,
      ahorroTotal: resultado.ahorroTotal,
      resumen: {
        total: productos.length,
        encontrados,
        noEncontrados: productos.length - encontrados,
      },
      fuente: resultado.fuente,
      nota:
        resultado.fuente === 'real'
          ? 'Precios obtenidos en tiempo real desde Lider y Jumbo.'
          : resultado.fuente === 'mixed'
            ? 'Algunos precios son aproximados (mezcla de datos reales y de referencia).'
            : 'Precios de referencia en CLP. Activa scraping real configurando las variables de entorno.',
    })
  } catch {
    logger.error('prices.request.error')
    return apiError('Error al comparar precios', 500, 'GET /api/prices')
  }
}
