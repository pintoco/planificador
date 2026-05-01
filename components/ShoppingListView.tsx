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
  fuente: 'real' | 'mock'
}

interface PricesResult {
  comparaciones: ComparacionPrecio[]
  totalPorSuper: { lider: number; jumbo: number }
  mejorOpcion: 'lider' | 'jumbo' | 'empate'
  ahorroTotal: number
  resumen: { total: number; encontrados: number; noEncontrados: number }
  fuente: 'real' | 'mock' | 'mixed'
}

const CATEGORIA_ICONS: Record<string, string> = {
  'Frutas y Verduras': '🥦',
  'Carnes y Pescados': '🥩',
  'Lácteos y Huevos': '🥛',
  'Cereales y Legumbres': '🌾',
  'Aceites y Condimentos': '🫒',
  Otros: '🛍️',
}

const clp = (n: number) => `$${n.toLocaleString('es-CL')}`

interface ShoppingListViewProps {
  categorias: CategoriaCompras[]
}

export default function ShoppingListView({ categorias }: ShoppingListViewProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [prices, setPrices] = useState<PricesResult | null>(null)
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [priceError, setPriceError] = useState('')
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
    setPriceError('')
    try {
      const res = await fetch(`/api/prices?items=${encodeURIComponent(items.join(','))}`)
      const data = await res.json()
      if (!res.ok || !data.comparaciones) {
        setPriceError(data.error ?? 'No se pudieron obtener los precios')
        setPrices(null)
        return
      }
      setPrices(data)
    } catch {
      setPriceError('Error de conexión al obtener precios')
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
          <button onClick={() => setChecked(new Set())} className="text-xs text-green-600 hover:text-green-800">
            Limpiar
          </button>
        )}
      </div>

      {/* Botón comparar */}
      <button
        onClick={handleCompararPrecios}
        disabled={loadingPrices || totalItems === 0}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
      >
        {loadingPrices ? (
          <><span className="animate-spin">⏳</span> Buscando precios...</>
        ) : (
          <>🛒 Comparar precios Lider vs Jumbo</>
        )}
      </button>

      {/* Panel de comparación */}
      {showPrices && (
        <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
            <h3 className="font-semibold text-blue-900 text-sm">Comparación de precios (CLP)</h3>
            <button onClick={() => setShowPrices(false)} className="text-xs text-blue-500 hover:text-blue-700">
              Cerrar
            </button>
          </div>

          {loadingPrices ? (
            <div className="p-8 text-center text-gray-400 text-sm">Consultando precios en Lider y Jumbo...</div>
          ) : priceError ? (
            <div className="p-6 text-center text-red-500 text-sm">{priceError}</div>
          ) : !prices ? null : (
            <div className="p-4 space-y-4">

              {/* Resumen totales */}
              <div className="grid grid-cols-2 gap-3">
                {(['lider', 'jumbo'] as const).map((super_) => {
                  const total = prices.totalPorSuper[super_]
                  const isBest = prices.mejorOpcion === super_
                  return (
                    <div
                      key={super_}
                      className={`rounded-lg p-3 text-center border ${isBest ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className={`text-xs font-semibold uppercase tracking-wide ${isBest ? 'text-green-700' : 'text-gray-500'}`}>
                        {super_ === 'lider' ? 'Lider' : 'Jumbo'}
                        {isBest && <span className="ml-1">⭐</span>}
                      </div>
                      <div className={`text-xl font-bold mt-1 ${isBest ? 'text-green-700' : 'text-gray-700'}`}>
                        {total > 0 ? clp(total) : '—'}
                      </div>
                      {isBest && <div className="text-xs text-green-600 mt-0.5 font-medium">Más barato</div>}
                    </div>
                  )
                })}
              </div>

              {/* Indicador de ahorro */}
              {prices.mejorOpcion !== 'empate' && prices.ahorroTotal > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 text-center">
                  👉 Comprando en <strong>{prices.mejorOpcion === 'lider' ? 'Lider' : 'Jumbo'}</strong> ahorras{' '}
                  <strong>{clp(prices.ahorroTotal)}</strong>
                </div>
              )}

              {/* Fuente de datos */}
              <p className="text-xs text-gray-400">
                {prices.resumen.encontrados} de {prices.resumen.total} productos encontrados ·{' '}
                {prices.fuente === 'real' ? 'Precios en tiempo real' : prices.fuente === 'mixed' ? 'Precios mixtos (real + referencia)' : 'Precios de referencia'}
              </p>

              {/* Detalle por producto */}
              <div className="space-y-2">
                {prices.comparaciones
                  .filter((c) => c.precios.length > 0)
                  .map((c) => (
                    <div key={c.producto} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-800 capitalize">{c.producto}</p>
                        {c.fuente === 'real' && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">en vivo</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {c.precios.map((p) => (
                          <div
                            key={p.supermercado}
                            className={`flex-1 rounded-md p-2 text-center text-xs ${
                              c.mejorPrecio?.supermercado === p.supermercado
                                ? 'bg-green-100 border border-green-300'
                                : 'bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <div className="font-semibold text-gray-600">
                              {p.supermercado === 'lider' ? 'Lider' : 'Jumbo'}
                            </div>
                            <div className={`font-bold mt-0.5 ${c.mejorPrecio?.supermercado === p.supermercado ? 'text-green-700' : 'text-gray-600'}`}>
                              {clp(p.precio)}
                            </div>
                            {c.mejorPrecio?.supermercado === p.supermercado && c.ahorro > 0 && (
                              <div className="text-green-600 text-xs mt-0.5">
                                -{clp(c.ahorro)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Productos sin precio */}
              {prices.resumen.noEncontrados > 0 && (
                <details className="text-xs text-gray-400">
                  <summary className="cursor-pointer">
                    {prices.resumen.noEncontrados} producto(s) sin precio disponible
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
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                    {isChecked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`flex-1 text-sm capitalize ${isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
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
