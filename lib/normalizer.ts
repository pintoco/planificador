// Normalización de nombres de productos para mejorar resultados de búsqueda
// Sin IA — solo reglas estáticas extensibles

interface NormalizationRule {
  variants: string[]    // términos de búsqueda alternativos
  searchTerm: string    // término principal para buscar en supermercados
}

const RULES: Record<string, NormalizationRule> = {
  arroz: {
    searchTerm: 'arroz grado 1',
    variants: ['arroz grano largo', 'arroz blanco', 'arroz 1kg'],
  },
  'arroz integral': {
    searchTerm: 'arroz integral',
    variants: ['arroz integral grano largo', 'arroz integral 1kg'],
  },
  pollo: {
    searchTerm: 'pollo entero',
    variants: ['pollo trozado', 'bandeja pollo'],
  },
  'pechuga de pollo': {
    searchTerm: 'pechuga pollo',
    variants: ['filete pechuga', 'pechuga sin hueso'],
  },
  'muslos de pollo': {
    searchTerm: 'trutro pollo',
    variants: ['trutro corto', 'muslo pollo bandeja'],
  },
  leche: {
    searchTerm: 'leche entera',
    variants: ['leche semidescremada', 'leche larga vida', 'leche 1 litro'],
  },
  huevos: {
    searchTerm: 'huevos docena',
    variants: ['huevos 12 unidades', 'huevo blanco'],
  },
  pan: {
    searchTerm: 'marraqueta',
    variants: ['pan molde', 'hallulla', 'pan francés'],
  },
  'pan integral': {
    searchTerm: 'pan integral molde',
    variants: ['pan integral rebanado', 'pan de molde integral'],
  },
  aceite: {
    searchTerm: 'aceite vegetal',
    variants: ['aceite girasol', 'aceite canola', 'aceite 1 litro'],
  },
  'aceite de oliva': {
    searchTerm: 'aceite oliva',
    variants: ['aceite de oliva extra virgen', 'aceite oliva 500ml'],
  },
  avena: {
    searchTerm: 'avena tradicional',
    variants: ['avena instantánea', 'avena quaker', 'avena 500g'],
  },
  tomate: {
    searchTerm: 'tomate',
    variants: ['tomate ensalada', 'tomate bolsa'],
  },
  lechuga: {
    searchTerm: 'lechuga',
    variants: ['lechuga costina', 'lechuga hidropónica'],
  },
  cebolla: {
    searchTerm: 'cebolla',
    variants: ['cebolla blanca', 'cebolla malla'],
  },
  zanahoria: {
    searchTerm: 'zanahoria',
    variants: ['zanahoria bolsa', 'zanahoria 1kg'],
  },
  papa: {
    searchTerm: 'papa',
    variants: ['papa blanca', 'papa malla', 'papas 1kg'],
  },
  palta: {
    searchTerm: 'palta hass',
    variants: ['palta negra', 'aguacate', 'palta unidad'],
  },
  manzana: {
    searchTerm: 'manzana roja',
    variants: ['manzana fuji', 'manzana verde', 'manzana 1kg'],
  },
  naranja: {
    searchTerm: 'naranja',
    variants: ['naranja malla', 'naranja 1kg'],
  },
  platano: {
    searchTerm: 'plátano',
    variants: ['banana', 'plátano manzano'],
  },
  salmon: {
    searchTerm: 'salmón filete',
    variants: ['filete salmón', 'salmón fresco', 'salmón 1kg'],
  },
  atun: {
    searchTerm: 'atún lata',
    variants: ['atún al agua', 'conserva atún'],
  },
  lentejas: {
    searchTerm: 'lentejas',
    variants: ['lentejas 1kg', 'lenteja bolsa'],
  },
  garbanzos: {
    searchTerm: 'garbanzos',
    variants: ['garbanzo 1kg', 'garbanzo bolsa'],
  },
  queso: {
    searchTerm: 'queso gauda',
    variants: ['queso mantecoso', 'queso laminado', 'queso 1kg'],
  },
  yogur: {
    searchTerm: 'yoghurt natural',
    variants: ['yogurt sin azúcar', 'yoghurt descremado'],
  },
  mantequilla: {
    searchTerm: 'mantequilla',
    variants: ['mantequilla 250g', 'mantequilla sin sal'],
  },
  sal: {
    searchTerm: 'sal fina',
    variants: ['sal yodada', 'sal 1kg'],
  },
  azucar: {
    searchTerm: 'azúcar blanca',
    variants: ['azúcar 1kg', 'azúcar granulada'],
  },
  harina: {
    searchTerm: 'harina sin polvos',
    variants: ['harina 1kg', 'harina trigo'],
  },
  espinaca: {
    searchTerm: 'espinaca',
    variants: ['espinaca bolsa', 'espinaca baby'],
  },
  brocoli: {
    searchTerm: 'brócoli',
    variants: ['brocoli unidad', 'brécol'],
  },
  champiñones: {
    searchTerm: 'champiñones',
    variants: ['hongos champiñon', 'champiñon bandeja'],
  },
}

// Normaliza el nombre de entrada a su clave canónica en RULES
function toCanonicalKey(input: string): string {
  const s = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quitar tildes
    .trim()

  // Búsqueda exacta
  if (RULES[s]) return s

  // Buscar si la entrada contiene alguna clave
  for (const key of Object.keys(RULES)) {
    const normalizedKey = key.normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (s === normalizedKey || s.includes(normalizedKey) || normalizedKey.includes(s)) {
      return key
    }
  }

  return s
}

// Devuelve el término principal de búsqueda para usar en scrapers
export function getSearchTerm(productName: string): string {
  const key = toCanonicalKey(productName)
  return RULES[key]?.searchTerm ?? productName.toLowerCase().trim()
}

// Devuelve variantes para reintentar si el término principal no da resultados
export function normalizeProduct(productName: string): string[] {
  const key = toCanonicalKey(productName)
  const rule = RULES[key]
  if (!rule) return [productName.toLowerCase().trim()]
  return [rule.searchTerm, ...rule.variants]
}
