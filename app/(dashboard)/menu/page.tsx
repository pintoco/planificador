'use client'

import { useEffect, useState } from 'react'
import MenuCard from '@/components/MenuCard'
import Link from 'next/link'

interface MenuDia {
  dia: string
  comidas: { desayuno: string; almuerzo: string; cena: string }
}

interface MenuData {
  dias: MenuDia[]
}

export default function MenuPage() {
  const [menu, setMenu] = useState<MenuData | null>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/menu')
      .then((r) => r.json())
      .then((data) => {
        if (data.menu) {
          setMenu(data.menu.menu as MenuData)
          setCreatedAt(data.menu.createdAt)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Cargando menú...</div>
      </div>
    )
  }

  if (!menu) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">🍽️</p>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Sin menú generado</h2>
        <p className="text-gray-500 text-sm mb-6">Ve al dashboard y genera tu primer menú semanal</p>
        <Link
          href="/dashboard"
          className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Ir al Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menú Semanal</h1>
          {createdAt && (
            <p className="text-sm text-gray-400 mt-1">
              Generado el {new Date(createdAt).toLocaleDateString('es-CL', { dateStyle: 'long' })}
            </p>
          )}
        </div>
        <Link
          href="/dashboard/shopping-list"
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5"
        >
          🛒 Lista de compras
        </Link>
      </div>
      <MenuCard dias={menu.dias} />
    </div>
  )
}
