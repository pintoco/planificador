// Scraping de Lider.cl — Walmart Chile
// Usa la API pública de búsqueda de Lider (plataforma Walmart)

import type { PrecioProducto } from '@/services/price-comparator.service'
import { logger } from '@/lib/logger'

const BASE_URL = 'https://www.lider.cl'
const TIMEOUT_MS = 8000
const MAX_RESULTS = 3

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'es-CL,es;q=0.9',
  'Referer': 'https://www.lider.cl/',
}

interface LiderProduct {
  displayName?: string
  name?: string
  brand?: string
  price?: number
  priceNeto?: number
  offers?: Array<{ price?: number; priceNeto?: number }>
  variants?: Array<{ price?: number; priceNeto?: number; name?: string }>
  url?: string
  slug?: string
}

function extractPrice(product: LiderProduct): number {
  return (
    product.price ??
    product.priceNeto ??
    product.offers?.[0]?.price ??
    product.offers?.[0]?.priceNeto ??
    product.variants?.[0]?.price ??
    0
  )
}

function parseLiderProduct(raw: LiderProduct): PrecioProducto | null {
  try {
    const precio = extractPrice(raw)
    if (!precio || precio <= 0) return null

    const nombre = raw.displayName ?? raw.name ?? 'Producto'
    const slug = raw.url ?? raw.slug ?? ''
    const url = slug.startsWith('http') ? slug : `${BASE_URL}/supermercado/p/${slug}`

    return {
      supermercado: 'lider',
      nombre: nombre.trim(),
      precio: Math.round(precio),
      unidad: 'un',
      url,
    }
  } catch {
    return null
  }
}

// Intenta parsear __NEXT_DATA__ del HTML si la API JSON no está disponible
function parseNextData(html: string, query: string): PrecioProducto[] {
  try {
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
    if (!match?.[1]) return []

    const nextData = JSON.parse(match[1])
    // La estructura de NEXT_DATA varía según la versión del sitio
    const products: unknown[] =
      nextData?.props?.pageProps?.searchResult?.products ??
      nextData?.props?.pageProps?.data?.search?.products ??
      nextData?.props?.pageProps?.products ??
      []

    if (!Array.isArray(products)) return []

    return (products as LiderProduct[])
      .map(parseLiderProduct)
      .filter((p): p is PrecioProducto => p !== null)
      .slice(0, MAX_RESULTS)
  } catch {
    return []
  }
}

export async function searchLider(query: string): Promise<PrecioProducto[]> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    // Intento 1: API JSON de búsqueda de Lider
    const apiUrl = `${BASE_URL}/supermercado/search?query=${encodeURIComponent(query)}&format=json`

    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: HEADERS,
    })

    const contentType = res.headers.get('content-type') ?? ''

    if (res.ok && contentType.includes('application/json')) {
      const data: unknown = await res.json()
      const products: LiderProduct[] = Array.isArray(data)
        ? (data as LiderProduct[])
        : ((data as Record<string, unknown>)?.products as LiderProduct[] ?? [])

      const results = products
        .map(parseLiderProduct)
        .filter((p): p is PrecioProducto => p !== null)
        .slice(0, MAX_RESULTS)

      if (results.length > 0) {
        logger.info('lider.scraper.success', { metadata: { query, found: results.length, method: 'json_api' } })
        return results
      }
    }

    // Intento 2: parsear HTML con __NEXT_DATA__
    if (res.ok && contentType.includes('text/html')) {
      const html = await res.text()
      const results = parseNextData(html, query)
      if (results.length > 0) {
        logger.info('lider.scraper.success', { metadata: { query, found: results.length, method: 'next_data' } })
        return results
      }
    }

    logger.warn('lider.scraper.no_results', { metadata: { query, status: res.status } })
    return []
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') {
      logger.warn('lider.scraper.timeout', { metadata: { query } })
    } else {
      logger.warn('lider.scraper.error', { metadata: { query, reason: (error as Error)?.message } })
    }
    return []
  } finally {
    clearTimeout(timeoutId)
  }
}
