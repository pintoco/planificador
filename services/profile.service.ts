import { prisma } from '@/lib/db'

export interface ProfileInput {
  objetivo: string
  alergias: string[]
  preferencias: string[]
  personas: number
}

export async function saveProfile(userId: string, data: ProfileInput) {
  return prisma.profile.upsert({
    where: { userId },
    update: {
      objetivo: data.objetivo,
      alergias: data.alergias,
      preferencias: data.preferencias,
      personas: data.personas,
    },
    create: {
      userId,
      objetivo: data.objetivo,
      alergias: data.alergias,
      preferencias: data.preferencias,
      personas: data.personas,
    },
  })
}

export async function getProfile(userId: string) {
  return prisma.profile.findUnique({ where: { userId } })
}
