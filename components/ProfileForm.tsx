'use client'

import { useState } from 'react'

const OBJETIVOS = [
  { value: 'bajar_peso', label: 'Bajar de peso' },
  { value: 'ganar_musculo', label: 'Ganar músculo' },
  { value: 'mantener', label: 'Mantener peso' },
  { value: 'saludable', label: 'Comer más saludable' },
]

const ALERGIAS_OPCIONES = ['Gluten', 'Lactosa', 'Nueces', 'Mariscos', 'Huevo', 'Soja']
const PREFERENCIAS_OPCIONES = ['Vegetariano', 'Vegano', 'Sin gluten', 'Bajo en carbohidratos', 'Mediterráneo']

interface ProfileFormProps {
  initialData?: {
    objetivo?: string
    alergias?: string[]
    preferencias?: string[]
    personas?: number
  }
  onSaved: () => void
}

export default function ProfileForm({ initialData, onSaved }: ProfileFormProps) {
  const [objetivo, setObjetivo] = useState(initialData?.objetivo ?? '')
  const [alergias, setAlergias] = useState<string[]>(initialData?.alergias ?? [])
  const [preferencias, setPreferencias] = useState<string[]>(initialData?.preferencias ?? [])
  const [personas, setPersonas] = useState(initialData?.personas ?? 1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleArray(arr: string[], setArr: (v: string[]) => void, value: string) {
    setArr(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!objetivo) { setError('Selecciona un objetivo'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objetivo, alergias, preferencias, personas }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Objetivo nutricional</label>
        <div className="grid grid-cols-2 gap-2">
          {OBJETIVOS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setObjetivo(o.value)}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                objetivo === o.value
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número de personas
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPersonas(Math.max(1, personas - 1))}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-gray-700"
          >
            −
          </button>
          <span className="w-8 text-center font-semibold text-gray-900">{personas}</span>
          <button
            type="button"
            onClick={() => setPersonas(Math.min(10, personas + 1))}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-gray-700"
          >
            +
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Alergias (opcional)</label>
        <div className="flex flex-wrap gap-2">
          {ALERGIAS_OPCIONES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleArray(alergias, setAlergias, a)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                alergias.includes(a)
                  ? 'bg-red-50 border-red-400 text-red-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferencias alimentarias (opcional)
        </label>
        <div className="flex flex-wrap gap-2">
          {PREFERENCIAS_OPCIONES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => toggleArray(preferencias, setPreferencias, p)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                preferencias.includes(p)
                  ? 'bg-blue-50 border-blue-400 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        {loading ? 'Guardando...' : 'Guardar perfil'}
      </button>
    </form>
  )
}
