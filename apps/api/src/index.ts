import { config } from 'dotenv'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from './lib/prisma.js'
import Fastify from 'fastify'
import cors from '@fastify/cors'

// Load PanChat root .env
const __dirname = fileURLToPath(new URL('.', import.meta.url))
config({ path: resolve(__dirname, '../../../.env') })

const host = process.env.API_HOST ?? '0.0.0.0'
const port = Number(process.env.API_PORT ?? 4000)

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
})

app.get('/health', async () => {
  return { ok : true }
})

app.get('/health/db', async () => {
  await prisma.$queryRaw`SELECT 1`
  return { ok: true,database: 'connected'}
})

const start = async () => {
  try {
    await app.listen({ host, port })
    console.log(`PanChat API listening on http://${host}:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()