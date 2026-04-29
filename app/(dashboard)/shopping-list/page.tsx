'use client'

import { useEffect, useState } from 'react'
import ShoppingListView from '@/components/ShoppingListView'
import Link from 'next/link'

interface CategoriaCompras {
  categoria: string
  items: { nombre: string; cantidad: string; unidad: string }[]
}

export default function ShoppingListPage() {
  const [categorias, setCategorias] = useState<CategoriaCompras[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/shopping-list')
      .then((r) => r.json())
      .then((data) => {
        if (data.lista) {
          setCategorias(data.lista.items as CategoriaCompras[])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Cargando lista...</div>
      </div>
    )
  }

  if (!categorias) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">🛒</p>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Sin lista de compras</h2>
        <p className="text-gray-500 text-sm mb-6">Genera un menú semanal para obtener tu lista</p>
        <Link
          href="/dashboard"
          className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Ir al Dashboard
        </Link>
      </div>
    )
  }

  const totalItems = categorias.reduce((acc, c) => acc + c.items.length, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lista de Compras</h1>
          <p className="text-sm text-gray-400 mt-1">
            {totalItems} productos en {categorias.length} categorías
          </p>
        </div>
        <Link
          href="/dashboard/menu"
          className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Ver menú 🍽️
        </Link>
      </div>
      <ShoppingListView categorias={categorias} />
    </div>
  )
}
