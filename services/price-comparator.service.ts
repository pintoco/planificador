// FASE 2 — Comparador de precios supermercados Chile
// Precios en CLP (pesos chilenos), actualizados aproximadamente

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
}

// Mock de precios comunes en CLP — reemplazar con scraping real en Fase 2
const MOCK_DB: Record<string, { lider: number; jumbo: number; unidad: string; alias?: string[] }> = {
  arroz: { lider: 1490, jumbo: 1590, unidad: 'kg' },
  'arroz integral': { lider: 1890, jumbo: 1990, unidad: 'kg' },
  pollo: { lider: 3990, jumbo: 4290, unidad: 'kg', alias: ['pechuga de pollo', 'muslos de pollo', 'pollo entero'] },
  'pechuga de pollo': { lider: 4990, jumbo: 5290, unidad: 'kg' },
  leche: { lider: 890, jumbo: 990, unidad: 'lt' },
  huevos: { lider: 2490, jumbo: 2690, unidad: 'doc' },
  pan: { lider: 990, jumbo: 1090, unidad: 'un', alias: ['pan integral', 'marraqueta'] },
  'pan integral': { lider: 1290, jumbo: 1390, unidad: 'un' },
  aceite: { lider: 2990, jumbo: 3290, unidad: 'lt', alias: ['aceite de oliva', 'aceite vegetal'] },
  'aceite de oliva': { lider: 4990, jumbo: 5490, unidad: '500ml' },
  avena: { lider: 1190, jumbo: 1290, unidad: '500g' },
  tomate: { lider: 990, jumbo: 1090, unidad: 'kg' },
  lechuga: { lider: 690, jumbo: 790, unidad: 'un' },
  cebolla: { lider: 590, jumbo: 690, unidad: 'kg' },
  zanahoria: { lider: 490, jumbo: 590, unidad: 'kg' },
  papa: { lider: 890, jumbo: 990, unidad: 'kg', alias: ['patata', 'papas'] },
  platano: { lider: 990, jumbo: 1090, unidad: 'kg', alias: ['plátano', 'banana'] },
  manzana: { lider: 1290, jumbo: 1390, unidad: 'kg' },
  naranja: { lider: 890, jumbo: 990, unidad: 'kg' },
  palta: { lider: 2490, jumbo: 2690, unidad: 'kg', alias: ['aguacate', 'palta hass'] },
  salmon: { lider: 8990, jumbo: 9490, unidad: 'kg', alias: ['salmón', 'filete de salmon'] },
  atun: { lider: 990, jumbo: 1090, unidad: 'lata', alias: ['atún'] },
  lentejas: { lider: 1190, jumbo: 1290, unidad: 'kg' },
  garbanzos: { lider: 1390, jumbo: 1490, unidad: 'kg' },
  queso: { lider: 3990, jumbo: 4290, unidad: 'kg', alias: ['queso gauda', 'queso mantecoso'] },
  yogur: { lider: 590, jumbo: 690, unidad: 'un', alias: ['yoghurt', 'yogurt'] },
  mantequilla: { lider: 1890, jumbo: 1990, unidad: '250g' },
  sal: { lider: 390, jumbo: 490, unidad: 'kg' },
  azucar: { lider: 890, jumbo: 990, unidad: 'kg', alias: ['azúcar'] },
  harina: { lider: 890, jumbo: 990, unidad: 'kg' },
  espinaca: { lider: 790, jumbo: 890, unidad: 'bolsa' },
  brocoli: { lider: 1190, jumbo: 1290, unidad: 'un', alias: ['brócoli'] },
  champiñones: { lider: 1490, jumbo: 1590, unidad: '200g' },
}

// Sustituciones simples sin IA
const SUSTITUCIONES: Record<string, string[]> = {
  palta: ['palta hass', 'aguacate'],
  pollo: ['pechuga de pollo', 'muslos de pollo', 'pavo molido'],
  salmon: ['salmón fresco', 'atún en lata', 'reineta'],
  leche: ['leche descremada', 'leche vegetal', 'bebida de avena'],
  mantequilla: ['margarina', 'aceite de coco'],
  queso: ['queso light', 'requesón'],
  pan: ['pan integral', 'tortillas de maíz'],
  azucar: ['stevia', 'miel', 'endulzante'],
  harina: ['harina integral', 'harina de avena'],
}

export function suggestSubstitutions(productName: string): string[] {
  const key = productName.toLowerCase().trim()
  if (SUSTITUCIONES[key]) return SUSTITUCIONES[key]
  // Búsqueda parcial
  for (const [k, v] of Object.entries(SUSTITUCIONES)) {
    if (key.includes(k) || k.includes(key)) return v
  }
  return []
}

function findMockEntry(name: string) {
  const key = name.toLowerCase().trim()
  if (MOCK_DB[key]) return { key, entry: MOCK_DB[key] }
  // Buscar por alias
  for (const [k, entry] of Object.entries(MOCK_DB)) {
    if (entry.alias?.some((a) => a.toLowerCase() === key || key.includes(a.toLowerCase()))) {
      return { key: k, entry }
    }
  }
  // Búsqueda parcial en claves
  for (const [k, entry] of Object.entries(MOCK_DB)) {
    if (key.includes(k) || k.includes(key)) return { key: k, entry }
  }
  return null
}

export function searchProduct(productName: string): PrecioProducto[] {
  const found = findMockEntry(productName)
  if (!found) return []
  const { key, entry } = found
  const nombre = key.charAt(0).toUpperCase() + key.slice(1)
  return [
    { supermercado: 'lider', nombre, precio: entry.lider, unidad: entry.unidad, url: `https://www.lider.cl/supermercado/search?query=${encodeURIComponent(key)}` },
    { supermercado: 'jumbo', nombre, precio: entry.jumbo, unidad: entry.unidad, url: `https://www.jumbo.cl/search?q=${encodeURIComponent(key)}` },
  ]
}

export function compareProducts(productos: string[]): ComparacionPrecio[] {
  return productos.map((producto) => {
    const precios = searchProduct(producto)
    if (precios.length === 0) {
      return { producto, precios: [], mejorPrecio: null, ahorro: 0 }
    }
    const sorted = [...precios].sort((a, b) => a.precio - b.precio)
    const mejorPrecio = sorted[0]
    const ahorro = sorted.length > 1 ? sorted[sorted.length - 1].precio - sorted[0].precio : 0
    return { producto, precios, mejorPrecio, ahorro }
  })
}
