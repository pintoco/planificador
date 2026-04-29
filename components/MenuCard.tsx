'use client'

interface ComidaDia {
  dia: string
  comidas: {
    desayuno: string
    almuerzo: string
    cena: string
  }
}

interface MenuCardProps {
  dias: ComidaDia[]
}

const COMIDA_ICONS: Record<string, string> = {
  desayuno: '☀️',
  almuerzo: '🌤️',
  cena: '🌙',
}

export default function MenuCard({ dias }: MenuCardProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {dias.map((diaData) => (
        <div key={diaData.dia} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-green-600 px-4 py-2">
            <h3 className="font-semibold text-white text-sm">{diaData.dia}</h3>
          </div>
          <div className="p-4 space-y-3">
            {(['desayuno', 'almuerzo', 'cena'] as const).map((tipo) => (
              <div key={tipo}>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  {COMIDA_ICONS[tipo]} {tipo}
                </p>
                <p className="text-sm text-gray-700 mt-0.5 leading-snug">
                  {diaData.comidas[tipo]}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
