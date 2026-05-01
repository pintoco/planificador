// TODO Fase 2 — Scraping de Lider.cl
// URL base: https://www.lider.cl/supermercado/search?query={producto}
// La API interna de Lider usa: https://www.lider.cl/api/catalog_system/pub/products/search

import type { PrecioProducto } from '@/services/price-comparator.service'

// TODO: implementar con fetch + parsing de la respuesta JSON de la API interna de Lider
export async function scrapeLider(_query: string): Promise<PrecioProducto[]> {
  throw new Error('Lider scraper no implementado — Fase 2')
}

// TODO: parsear el array de productos devuelto por la API
function parseLiderProduct(_raw: unknown): PrecioProducto | null {
  return null
}
