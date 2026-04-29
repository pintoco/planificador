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

const CATEGORIA_ICONS: Record<string, string> = {
  'Frutas y Verduras': '🥦',
  'Carnes y Pescados': '🥩',
  'Lácteos y Huevos': '🥛',
  'Cereales y Legumbres': '🌾',
  'Aceites y Condimentos': '🫒',
  Otros: '🛍️',
}

interface ShoppingListViewProps {
  categorias: CategoriaCompras[]
}

export default function ShoppingListView({ categorias }: ShoppingListViewProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  function toggleItem(key: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const totalItems = categorias.reduce((acc, c) => acc + c.items.length, 0)
  const completados = checked.size

  return (
    <div className="space-y-4">
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
