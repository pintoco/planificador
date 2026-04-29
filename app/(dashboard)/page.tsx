'use client'

import { useState, useEffect } from 'react'
import ProfileForm from '@/components/ProfileForm'
import Link from 'next/link'

interface Profile {
  objetivo: string
  alergias: string[]
  preferencias: string[]
  personas: number
}

const OBJETIVO_LABELS: Record<string, string> = {
  bajar_peso: 'Bajar de peso',
  ganar_musculo: 'Ganar músculo',
  mantener: 'Mantener peso',
  saludable: 'Comer más saludable',
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [hasMenu, setHasMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, menuRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/menu'),
        ])
        const profileData = await profileRes.json()
        const menuData = await menuRes.json()
        setProfile(profileData.profile)
        setHasMenu(!!menuData.menu)
        setShowForm(!profileData.profile)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleGenerate() {
    setGenError('')
    setGenerating(true)
    try {
      const res = await fetch('/api/menu/generate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setHasMenu(true)
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Error al generar')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Planificador Inteligente de Alimentación</p>
      </div>

      {showForm || !profile ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {profile ? 'Editar perfil' : 'Configura tu perfil'}
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Personaliza el plan según tus necesidades y objetivos
          </p>
          <ProfileForm
            initialData={profile ?? undefined}
            onSaved={() => {
              setShowForm(false)
              fetch('/api/profile')
                .then((r) => r.json())
                .then((d) => setProfile(d.profile))
            }}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Objetivo</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {OBJETIVO_LABELS[profile.objetivo] ?? profile.objetivo}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Personas</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">{profile.personas}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Restricciones</p>
            <p className="text-sm text-gray-700 mt-1">
              {[...profile.alergias, ...profile.preferencias].length > 0
                ? [...profile.alergias, ...profile.preferencias].join(', ')
                : 'Ninguna'}
            </p>
          </div>
        </div>
      )}

      {profile && !showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Generar menú semanal</h2>
          <p className="text-sm text-gray-500 mb-4">
            Claude IA creará un plan de 7 días con lista de compras incluida
          </p>
          {genError && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">{genError}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
            >
              {generating ? (
                <>
                  <span className="animate-spin">⏳</span> Generando con IA...
                </>
              ) : (
                <>✨ {hasMenu ? 'Regenerar menú' : 'Generar menú'}</>
              )}
            </button>
            {hasMenu && (
              <>
                <Link
                  href="/dashboard/menu"
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-5 py-2.5 rounded-lg transition-colors"
                >
                  Ver menú →
                </Link>
                <Link
                  href="/dashboard/shopping-list"
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-5 py-2.5 rounded-lg transition-colors"
                >
                  Ver lista 🛒
                </Link>
              </>
            )}
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm text-gray-400 hover:text-gray-600"
            >
              Editar perfil
            </button>
          )}
        </div>
      )}
    </div>
  )
}
