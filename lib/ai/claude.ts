import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface MenuDia {
  dia: string
  comidas: {
    desayuno: string
    almuerzo: string
    cena: string
  }
}

export interface MenuSemanal {
  dias: MenuDia[]
}

export interface IngredienteItem {
  nombre: string
  cantidad: string
  unidad: string
}

export interface CategoriaCompras {
  categoria: string
  items: IngredienteItem[]
}

export interface ProfileData {
  objetivo: string
  alergias: string[]
  preferencias: string[]
  personas: number
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export function menuFallback(): MenuSemanal {
  return {
    dias: DIAS_SEMANA.map((dia) => ({
      dia,
      comidas: {
        desayuno: 'Avena con frutas de temporada y té o café',
        almuerzo: 'Arroz integral con pollo a la plancha y ensalada verde',
        cena: 'Sopa de verduras con pan integral y fruta',
      },
    })),
  }
}

export function listaFallback(): CategoriaCompras[] {
  return [
    {
      categoria: 'Frutas y Verduras',
      items: [
        { nombre: 'frutas variadas', cantidad: '2', unidad: 'kg' },
        { nombre: 'verduras variadas', cantidad: '2', unidad: 'kg' },
        { nombre: 'lechuga', cantidad: '1', unidad: 'unidad' },
      ],
    },
    {
      categoria: 'Cereales y Legumbres',
      items: [
        { nombre: 'avena', cantidad: '500', unidad: 'g' },
        { nombre: 'arroz integral', cantidad: '1', unidad: 'kg' },
        { nombre: 'pan integral', cantidad: '2', unidad: 'unidades' },
      ],
    },
    {
      categoria: 'Carnes y Pescados',
      items: [{ nombre: 'pechuga de pollo', cantidad: '1', unidad: 'kg' }],
    },
    {
      categoria: 'Lácteos y Huevos',
      items: [
        { nombre: 'leche', cantidad: '1', unidad: 'litro' },
        { nombre: 'huevos', cantidad: '6', unidad: 'unidades' },
      ],
    },
    {
      categoria: 'Aceites y Condimentos',
      items: [{ nombre: 'aceite de oliva', cantidad: '1', unidad: 'botella' }],
    },
  ]
}

export async function generarMenuSemanal(profile: ProfileData): Promise<MenuSemanal> {
  const prompt = `Eres un nutricionista experto. Genera un menú semanal completo y balanceado.

Perfil del usuario:
- Objetivo: ${profile.objetivo}
- Alergias: ${profile.alergias.length > 0 ? profile.alergias.join(', ') : 'ninguna'}
- Preferencias: ${profile.preferencias.length > 0 ? profile.preferencias.join(', ') : 'ninguna'}
- Número de personas: ${profile.personas}

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin texto adicional, sin markdown):
{
  "dias": [
    {
      "dia": "Lunes",
      "comidas": {
        "desayuno": "descripción del desayuno",
        "almuerzo": "descripción del almuerzo",
        "cena": "descripción de la cena"
      }
    }
  ]
}

Incluye los 7 días: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo.
Cada comida debe ser específica con ingredientes principales.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8096,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Respuesta inesperada de Claude')

  const text = content.text.trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No se pudo extraer JSON de la respuesta de Claude')

  return JSON.parse(jsonMatch[0]) as MenuSemanal
}

export async function generarListaCompras(
  menu: MenuSemanal,
  personas: number
): Promise<CategoriaCompras[]> {
  const menuText = menu.dias
    .map(
      (d) =>
        `${d.dia}: Desayuno: ${d.comidas.desayuno} | Almuerzo: ${d.comidas.almuerzo} | Cena: ${d.comidas.cena}`
    )
    .join('\n')

  const prompt = `Eres un experto en planificación de compras. Analiza el menú y genera una lista consolidada para ${personas} persona(s).

MENÚ SEMANAL:
${menuText}

Responde ÚNICAMENTE con un JSON válido (sin texto adicional, sin markdown):
[
  {
    "categoria": "Frutas y Verduras",
    "items": [
      { "nombre": "tomates", "cantidad": "1", "unidad": "kg" }
    ]
  }
]

Categorías: "Frutas y Verduras", "Carnes y Pescados", "Lácteos y Huevos", "Cereales y Legumbres", "Aceites y Condimentos", "Otros".
Consolida ingredientes repetidos. Ajusta cantidades para ${personas} persona(s).`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Respuesta inesperada de Claude')

  const text = content.text.trim()
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No se pudo extraer JSON de la lista de compras')

  return JSON.parse(jsonMatch[0]) as CategoriaCompras[]
}
