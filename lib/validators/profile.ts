import { z } from 'zod'

export const OBJETIVOS = ['bajar_peso', 'ganar_musculo', 'mantener', 'saludable'] as const

export const profileSchema = z.object({
  objetivo: z.enum(OBJETIVOS, {
    errorMap: () => ({ message: 'Objetivo no válido. Opciones: bajar_peso, ganar_musculo, mantener, saludable' }),
  }),
  alergias: z.array(z.string().min(1)).default([]),
  preferencias: z.array(z.string().min(1)).default([]),
  personas: z
    .number({ invalid_type_error: 'Personas debe ser un número' })
    .int('Personas debe ser un número entero')
    .min(1, 'Mínimo 1 persona')
    .max(10, 'Máximo 10 personas'),
})

export type ProfileSchema = z.infer<typeof profileSchema>
