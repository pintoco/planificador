// Comparador de precios — Lider vs Jumbo (Chile)
// Arquitectura: scraping real → cache → fallback mock

import { searchLider } from '@/lib/scrapers/lider.scraper'
import { searchJumbo } from '@/lib/scrapers/jumbo.scraper'
import { getSearchTerm, normalizeProduct } from '@/lib/normalizer'
import { priceCache, TTL } from '@/lib/cache'
import { logger } from '@/lib/logger'

export interface PrecioProducto {
  supermercado: 'lider' | 'jumbo'
  nombre: string
  precio: number
  unidad: string
  url?: string
}

export interface ComparacionPrecio {
  producto: string
  precios: PrecioProducto[]
  mejorPrecio: PrecioProducto | null
  ahorro: number
  fuente: 'real' | 'mock'
}

export interface ResultadoComparacion {
  comparaciones: ComparacionPrecio[]
  totalPorSuper: { lider: number; jumbo: number }
  mejorOpcion: 'lider' | 'jumbo' | 'empate'
  ahorroTotal: number
  fuente: 'real' | 'mock' | 'mixed'
}

// ─── Sustituciones ────────────────────────────────────────────────────────────

const SUSTITUCIONES: Record<string, string[]> = {
  palta: ['palta hass', 'aguacate', 'palta negra'],
  pollo: ['trutro de pollo', 'pechuga de pollo', 'pollo trozado'],
  'pechuga de pollo': ['filete de pavo', 'pechuga pavo'],
  salmon: ['salmón fresco', 'filete de reineta', 'atún en lata'],
  leche: ['leche descremada', 'leche semidescremada', 'bebida de avena'],
  mantequilla: ['margarina', 'aceite de coco'],
  queso: ['queso light', 'requesón', 'queso ricotta'],
  pan: ['pan integral', 'tortillas de maíz', 'hallulla'],
  azucar: ['stevia', 'miel', 'sucralosa'],
  harina: ['harina integral', 'harina de avena', 'harina de arroz'],
  'aceite de oliva': ['aceite de maravilla', 'aceite de canola'],
  huevos: ['huevos de campo', 'claras de huevo'],
}

export function suggestSubstitutions(productName: string): string[] {
  const key = productName.toLowerCase().trim()
  if (SUSTITUCIONES[key]) return SUSTITUCIONES[key]
  for (const [k, v] of Object.entries(SUSTITUCIONES)) {
    if (key.includes(k) || k.includes(key)) return v
  }
  return []
}

// ─── Mock fallback ────────────────────────────────────────────────────────────

const MOCK_DB: Record<string, { lider: number; jumbo: number; alias?: string[] }> = {
  arroz: { lider: 1490, jumbo: 1590 },
  'arroz integral': { lider: 1890, jumbo: 1990 },
  pollo: { lider: 3990, jumbo: 4290, alias: ['pechuga de pollo', 'pollo entero'] },
  'pechuga de pollo': { lider: 4990, jumbo: 5290 },
  leche: { lider: 890, jumbo: 990 },
  huevos: { lider: 2490, jumbo: 2690 },
  pan: { lider: 990, jumbo: 1090, alias: ['pan integral', 'marraqueta'] },
  'pan integral': { lider: 1290, jumbo: 1390 },
  aceite: { lider: 2990, jumbo: 3290 },
  'aceite de oliva': { lider: 4990, jumbo: 5490 },
  avena: { lider: 1190, jumbo: 1290 },
  tomate: { lider: 990, jumbo: 1090 },
  lechuga: { lider: 690, jumbo: 790 },
  cebolla: { lider: 590, jumbo: 690 },
  zanahoria: { lider: 490, jumbo: 590 },
  papa: { lider: 890, jumbo: 990, alias: ['papas', 'patata'] },
  platano: { lider: 990, jumbo: 1090, alias: ['plátano', 'banana'] },
  manzana: { lider: 1290, jumbo: 1390 },
  naranja: { lider: 890, jumbo: 990 },
  palta: { lider: 2490, jumbo: 2690, alias: ['aguacate', 'palta hass'] },
  salmon: { lider: 8990, jumbo: 9490, alias: ['salmón'] },
  atun: { lider: 990, jumbo: 1090, alias: ['atún'] },
  lentejas: { lider: 1190, jumbo: 1290 },
  garbanzos: { lider: 1390, jumbo: 1490 },
  queso: { lider: 3990, jumbo: 4290 },
  yogur: { lider: 590, jumbo: 690, alias: ['yoghurt', 'yogurt'] },
  mantequilla: { lider: 1890, jumbo: 1990 },
  sal: { lider: 390, jumbo: 490 },
  azucar: { lider: 890, jumbo: 990, alias: ['azúcar'] },
  harina: { lider: 890, jumbo: 990 },
  espinaca: { lider: 790, jumbo: 890 },
  brocoli: { lider: 1190, jumbo: 1290, alias: ['brócoli'] },
  champiñones: { lider: 1490, jumbo: 1590 },
}

function findMockEntry(name: string) {
  const key = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
  for (const [k, entry] of Object.entries(MOCK_DB)) {
    const normK = k.normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (key === normK) return { k, entry }
    if (entry.alias?.some((a) => a.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') === key)) return { k, entry }
    if (key.includes(normK) || normK.includes(key)) return { k, entry }
  }
  return null
}

function mockForProduct(producto: string): PrecioProducto[] {
  const found = findMockEntry(producto)
  if (!found) return []
  const { k, entry } = found
  const nombre = k.charAt(0).toUpperCase() + k.slice(1)
  return [
    { supermercado: 'lider', nombre, precio: entry.lider, unidad: 'un', url: `https://www.lider.cl/supermercado/search?query=${encodeURIComponent(k)}` },
    { supermercado: 'jumbo', nombre, precio: entry.jumbo, unidad: 'un', url: `https://www.jumbo.cl/search?q=${encodeURIComponent(k)}` },
  ]
}

// ─── Motor de comparación ──────────────────────────────────────────────────────

async function fetchProductPrices(producto: string): Promise<{ precios: PrecioProducto[]; fuente: 'real' | 'mock' }> {
  const cacheKey = `prices:${producto.toLowerCase().trim()}`
  const cached = priceCache.get<{ precios: PrecioProducto[]; fuente: 'real' | 'mock' }>(cacheKey)
  if (cached) return cached

  const searchTerm = getSearchTerm(producto)

  // Scraping paralelo de ambos supermercados
  const [liderResults, jumboResults] = await Promise.all([
    searchLider(searchTerm),
    searchJumbo(searchTerm),
  ])

  let precios: PrecioProducto[]
  let fuente: 'real' | 'mock'

  const hasReal = liderResults.length > 0 || jumboResults.length > 0

  if (hasReal) {
    // Tomar el más barato de cada supermercado si hay múltiples
    const bestLider = liderResults.sort((a, b) => a.precio - b.precio)[0]
    const bestJumbo = jumboResults.sort((a, b) => a.precio - b.precio)[0]
    precios = [bestLider, bestJumbo].filter(Boolean) as PrecioProducto[]
    fuente = 'real'
  } else {
    // Fallback a mock
    precios = mockForProduct(producto)
    fuente = 'mock'

    // Si tampoco hay mock, intentar variantes del normalizador
    if (precios.length === 0) {
      const variants = normalizeProduct(producto).slice(1)
      for (const variant of variants) {
        const found = mockForProduct(variant)
        if (found.length > 0) {
          precios = found
          break
        }
      }
    }
  }

  const result = { precios, fuente }
  if (precios.length > 0) {
    priceCache.set(cacheKey, result, TTL.PRICES)
  }
  return result
}

function buildComparacion(
  producto: string,
  precios: PrecioProducto[],
  fuente: 'real' | 'mock'
): ComparacionPrecio {
  if (precios.length === 0) {
    return { producto, precios: [], mejorPrecio: null, ahorro: 0, fuente }
  }
  const sorted = [...precios].sort((a, b) => a.precio - b.precio)
  const mejorPrecio = sorted[0]
  const ahorro = sorted.length > 1 ? sorted[sorted.length - 1].precio - sorted[0].precio : 0
  return { producto, precios, mejorPrecio, ahorro, fuente }
}

export async function compareProductsAsync(productos: string[]): Promise<ResultadoComparacion> {
  const limited = productos.slice(0, 20)

  logger.info('prices.compare.start', { metadata: { count: limited.length } })

  const comparaciones = await Promise.all(
    limited.map(async (producto) => {
      const { precios, fuente } = await fetchProductPrices(producto)
      return buildComparacion(producto, precios, fuente)
    })
  )

  // Calcular totales por supermercado (solo productos con precio)
  const totalLider = comparaciones.reduce((acc, c) => {
    const p = c.precios.find((x) => x.supermercado === 'lider')
    return acc + (p?.precio ?? 0)
  }, 0)

  const totalJumbo = comparaciones.reduce((acc, c) => {
    const p = c.precios.find((x) => x.supermercado === 'jumbo')
    return acc + (p?.precio ?? 0)
  }, 0)

  let mejorOpcion: 'lider' | 'jumbo' | 'empate' = 'empate'
  if (totalLider > 0 && totalJumbo > 0) {
    mejorOpcion = totalLider < totalJumbo ? 'lider' : totalJumbo < totalLider ? 'jumbo' : 'empate'
  } else if (totalLider > 0) {
    mejorOpcion = 'lider'
  } else if (totalJumbo > 0) {
    mejorOpcion = 'jumbo'
  }

  const ahorroTotal = Math.abs(totalLider - totalJumbo)

  const fuenteGeneral: 'real' | 'mock' | 'mixed' =
    comparaciones.every((c) => c.fuente === 'real')
      ? 'real'
      : comparaciones.every((c) => c.fuente === 'mock')
        ? 'mock'
        : 'mixed'

  logger.info('prices.compare.done', {
    metadata: { totalLider, totalJumbo, mejorOpcion, fuenteGeneral },
  })

  return {
    comparaciones,
    totalPorSuper: { lider: totalLider, jumbo: totalJumbo },
    mejorOpcion,
    ahorroTotal,
    fuente: fuenteGeneral,
  }
}

// Mantener compatibilidad con usos síncronos (solo mock)
export function compareProducts(productos: string[]) {
  return productos.map((producto) => {
    const precios = mockForProduct(producto)
    return buildComparacion(producto, precios, 'mock')
  })
}

// Exportar searchProduct para compatibilidad con tests
export function searchProduct(productName: string): PrecioProducto[] {
  return mockForProduct(productName)
}
