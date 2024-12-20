import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    datasources: {
      db: {
        url: process.env.POSTGRES_URL + '?pgbouncer=true'
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma