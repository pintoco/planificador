'use client'

import { useState } from 'react'

interface IngredienteItem {
  nombre: string
  cantidad: string
  unidad: string
}

interface CategoriaCompras {
  categoria: string
  items: IngredienteItem[]
}

interface PrecioProducto {
  supermercado: 'lider' | 'jumbo'
  nombre: string
  precio: number
  unidad: string
}

interface ComparacionPrecio {
  producto: string
  precios: PrecioProducto[]
  mejorPrecio: PrecioProducto | null
  ahorro: number
}

interface PricesResult {
  comparaciones: ComparacionPrecio[]
  resumen: { total: number; encontrados: number; ahorroTotal: number }
}

const CATEGORIA_ICONS: Record<string, string> = {
  'Frutas y Verduras': '🥦',
  'Carnes y Pescados': '🥩',
  'Lácteos y Huevos': '🥛',
  'Cereales y Legumbres': '🌾',
  'Aceites y Condimentos': '🫒',
  Otros: '🛍️',
}

const SUPER_LABELS: Record<string, string> = {
  lider: 'Lider',
  jumbo: 'Jumbo',
}

interface ShoppingListViewProps {
  categorias: CategoriaCompras[]
}

export default function ShoppingListView({ categorias }: ShoppingListViewProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [prices, setPrices] = useState<PricesResult | null>(null)
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [showPrices, setShowPrices] = useState(false)

  function toggleItem(key: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  async function handleCompararPrecios() {
    const items = categorias.flatMap((c) => c.items.map((i) => i.nombre))
    if (items.length === 0) return
    setLoadingPrices(true)
    setShowPrices(true)
    try {
      const res = await fetch(`/api/prices?items=${encodeURIComponent(items.join(','))}`)
      const data = await res.json()
      if (!res.ok || !data.comparaciones) {
        setPrices(null)
        return
      }
      setPrices(data)
    } catch {
      setPrices(null)
    } finally {
      setLoadingPrices(false)
    }
  }

  const totalItems = categorias.reduce((acc, c) => acc + c.items.length, 0)
  const completados = checked.size

  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
        <span className="text-sm text-green-700 font-medium">
          {completados} / {totalItems} productos marcados
        </span>
        <div className="h-2 flex-1 mx-4 bg-green-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${totalItems > 0 ? (completados / totalItems) * 100 : 0}%` }}
          />
        </div>
        {completados > 0 && (
          <button
            onClick={() => setChecked(new Set())}
            className="text-xs text-green-600 hover:text-green-800"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Botón comparar precios */}
      <button
        onClick={handleCompararPrecios}
        disabled={loadingPrices}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
      >
        {loadingPrices ? (
          <>
            <span className="animate-spin">⏳</span> Buscando precios...
          </>
        ) : (
          <>🛒 Comparar precios Lider vs Jumbo</>
        )}
      </button>

      {/* Panel de comparación */}
      {showPrices && (
        <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
            <h3 className="font-semibold text-blue-900 text-sm">Comparación de precios (CLP)</h3>
            <button
              onClick={() => setShowPrices(false)}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              Cerrar
            </button>
          </div>

          {loadingPrices ? (
            <div className="p-6 text-center text-gray-400 text-sm">Cargando precios...</div>
          ) : !prices ? (
            <div className="p-6 text-center text-red-500 text-sm">No se pudieron obtener los precios</div>
          ) : (
            <div className="p-4 space-y-3">
              {prices.resumen.ahorroTotal > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                  Ahorro potencial eligiendo el más barato: <strong>${prices.resumen.ahorroTotal.toLocaleString('es-CL')} CLP</strong>
                </div>
              )}

              <p className="text-xs text-gray-400">
                Precios aproximados. {prices.resumen.encontrados} de {prices.resumen.total} productos encontrados.
              </p>

              <div className="space-y-2">
                {prices.comparaciones
                  .filter((c) => c.precios.length > 0)
                  .map((c) => (
                    <div key={c.producto} className="border border-gray-100 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-800 capitalize mb-2">{c.producto}</p>
                      <div className="flex gap-3">
                        {c.precios.map((p) => (
                          <div
                            key={p.supermercado}
                            className={`flex-1 rounded-md p-2 text-center text-xs ${
                              c.mejorPrecio?.supermercado === p.supermercado
                                ? 'bg-green-100 border border-green-300'
                                : 'bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <div className="font-semibold text-gray-700">{SUPER_LABELS[p.supermercado]}</div>
                            <div className={`font-bold mt-0.5 ${c.mejorPrecio?.supermercado === p.supermercado ? 'text-green-700' : 'text-gray-600'}`}>
                              ${p.precio.toLocaleString('es-CL')}
                            </div>
                            <div className="text-gray-400">{p.unidad}</div>
                            {c.mejorPrecio?.supermercado === p.supermercado && (
                              <div className="text-green-600 font-medium mt-0.5">Más barato</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>

              {prices.comparaciones.filter((c) => c.precios.length === 0).length > 0 && (
                <details className="text-xs text-gray-400">
                  <summary className="cursor-pointer">
                    {prices.comparaciones.filter((c) => c.precios.length === 0).length} productos sin precio
                  </summary>
                  <ul className="mt-1 ml-3 space-y-0.5">
                    {prices.comparaciones
                      .filter((c) => c.precios.length === 0)
                      .map((c) => <li key={c.producto} className="capitalize">{c.producto}</li>)}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lista de productos */}
      {categorias.map((cat) => (
        <div key={cat.categoria} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <span>{CATEGORIA_ICONS[cat.categoria] ?? '📦'}</span>
            <h3 className="font-semibold text-gray-800 text-sm">{cat.categoria}</h3>
            <span className="ml-auto text-xs text-gray-400">{cat.items.length} items</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {cat.items.map((item, i) => {
              const key = `${cat.categoria}-${item.nombre}-${i}`
              const isChecked = checked.has(key)
              return (
                <li
                  key={key}
                  onClick={() => toggleItem(key)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isChecked ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}
                  >
                    {isChecked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`flex-1 text-sm capitalize ${isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}
                  >
                    {item.nombre}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {item.cantidad} {item.unidad}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
