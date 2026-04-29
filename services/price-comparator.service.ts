// FASE 2 — Comparador de precios supermercados Chile
// Implementación pendiente: scraping Lider y Jumbo

export interface PrecioProducto {
  supermercado: 'lider' | 'jumbo'
  nombre: string
  precio: number
  url: string
}

export interface ComparacionPrecio {
  producto: string
  precios: PrecioProducto[]
  mejorPrecio: PrecioProducto | null
}

// TODO Fase 2: Implementar scraping de Lider (https://www.lider.cl)
async function scrapeLider(_query: string): Promise<PrecioProducto[]> {
  throw new Error('No implementado aún — Fase 2')
}

// TODO Fase 2: Implementar scraping de Jumbo (https://www.jumbo.cl)
async function scrapeJumbo(_query: string): Promise<PrecioProducto[]> {
  throw new Error('No implementado aún — Fase 2')
}

export async function compararPrecios(_productos: string[]): Promise<ComparacionPrecio[]> {
  throw new Error('Comparador de precios no implementado aún — Fase 2')
}
