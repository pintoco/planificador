// Scraping de Jumbo.cl — plataforma VTEX (API JSON pública)
// Endpoint: https://www.jumbo.cl/api/catalog_system/pub/products/search

import type { PrecioProducto } from '@/services/price-comparator.service'
import { logger } from '@/lib/logger'

const BASE_URL = 'https://www.jumbo.cl'
const TIMEOUT_MS = 8000
const MAX_RESULTS = 3

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'es-CL,es;q=0.9',
  'Referer': 'https://www.jumbo.cl/',
}

interface VtexProduct {
  productName?: string
  productTitle?: string
  link?: string
  items?: Array<{
    name?: string
    sellers?: Array<{
      commertialOffer?: {
        Price?: number
        ListPrice?: number
        IsAvailable?: boolean
      }
    }>
  }>
}

function parseVtexProduct(raw: VtexProduct): PrecioProducto | null {
  try {
    const seller = raw.items?.[0]?.sellers?.[0]
    const offer = seller?.commertialOffer
    if (!offer?.Price || offer.Price <= 0) return null
    if (offer.IsAvailable === false) return null

    const nombre = raw.items?.[0]?.name ?? raw.productName ?? raw.productTitle ?? 'Producto'
    const url = raw.link ? (raw.link.startsWith('http') ? raw.link : `${BASE_URL}${raw.link}`) : `${BASE_URL}/search?q=`

    return {
      supermercado: 'jumbo',
      nombre: nombre.trim(),
      precio: Math.round(offer.Price),
      unidad: 'un',
      url,
    }
  } catch {
    return null
  }
}

export async function searchJumbo(query: string): Promise<PrecioProducto[]> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const url = `${BASE_URL}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=${MAX_RESULTS - 1}`

    const res = await fetch(url, {
      signal: controller.signal,
      headers: HEADERS,
    })

    if (!res.ok) {
      logger.warn('jumbo.scraper.http_error', { metadata: { status: res.status, query } })
      return []
    }

    const data: unknown = await res.json()
    if (!Array.isArray(data)) return []

    const results = (data as VtexProduct[])
      .map(parseVtexProduct)
      .filter((p): p is PrecioProducto => p !== null)
      .slice(0, MAX_RESULTS)

    logger.info('jumbo.scraper.success', { metadata: { query, found: results.length } })
    return results
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') {
      logger.warn('jumbo.scraper.timeout', { metadata: { query } })
    } else {
      logger.warn('jumbo.scraper.error', { metadata: { query, reason: (error as Error)?.message } })
    }
    return []
  } finally {
    clearTimeout(timeoutId)
  }
}
