// TODO Fase 2 — Scraping de Jumbo.cl
// URL base: https://www.jumbo.cl/search?q={producto}
// La API interna de Jumbo usa: https://www.jumbo.cl/api/catalog_system/pub/products/search

import type { PrecioProducto } from '@/services/price-comparator.service'

// TODO: implementar con fetch + parsing de la respuesta JSON de la API interna de Jumbo
export async function scrapeJumbo(_query: string): Promise<PrecioProducto[]> {
  throw new Error('Jumbo scraper no implementado — Fase 2')
}

// TODO: parsear el array de productos devuelto por la API
function parseJumboProduct(_raw: unknown): PrecioProducto | null {
  return null
}
