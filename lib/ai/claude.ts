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

Incluye los 7 días de la semana: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo.
Cada comida debe ser específica con ingredientes principales mencionados.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Respuesta inesperada de Claude')

  const text = content.text.trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No se pudo extraer JSON de la respuesta')

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

  const prompt = `Eres un experto en planificación de compras. Analiza el siguiente menú semanal y genera una lista de compras consolidada para ${personas} persona(s).

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

Categorías a usar: "Frutas y Verduras", "Carnes y Pescados", "Lácteos y Huevos", "Cereales y Legumbres", "Aceites y Condimentos", "Otros".
Consolida los ingredientes repetidos sumando cantidades. Ajusta para ${personas} persona(s).`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Respuesta inesperada de Claude')

  const text = content.text.trim()
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No se pudo extraer JSON de la respuesta')

  return JSON.parse(jsonMatch[0]) as CategoriaCompras[]
}
