import { config } from 'dotenv'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from './lib/prisma.js'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import bcrypt from 'bcrypt'
import { requireUser } from './lib/auth.js'
import { request } from 'node:http'

function orderUserPair(idA: string, idB: string): [string, string]{
  return idA < idB ? [idA , idB] : [idB , idA]
}

// Load PanChat root .env
const __dirname = fileURLToPath(new URL('.', import.meta.url))
config({ path: resolve(__dirname, '../../../.env') })

const jwtSecret = process.env.JWT_SECRET
if(!jwtSecret) {
  throw new Error('JWT_SECRET is missing in root .env')
}

const host = process.env.API_HOST ?? '0.0.0.0'
const port = Number(process.env.API_PORT ?? 4000)

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
})

await app.register(cookie)

await app.register(jwt , {
  secret: jwtSecret,
})

app.get('/health', async () => {
  return { ok : true }
})

app.get('/health/db', async () => {
  await prisma.$queryRaw`SELECT 1`
  return { ok: true,database: 'connected'}
})

app.post('/api/v1/auth/register', async (request, reply) => {
  const {email , password } = request.body as {
    email?: string
    password?: string
  }

  if(!email?.trim() || !password){
    return reply.code(400).send({ error: 'Email and password required'})
  }

  const normalizedEmail = email.trim().toLowerCase()

  if(password.length < 8){
    return reply.code(400).send({error: 'Password must be at least 8 characters' })
  }

  const existing = await prisma.user.findUnique({
    where: {email: normalizedEmail},
  })

  if(existing) {
    return reply.code(409).send({ error : 'Email already in use' })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
    },
  })

  const token = app.jwt.sign({ sub: user.id })

  reply.setCookie('token' , token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })

  return reply.code(201).send({
    user: {
      id: user.id,
      email: user.email,
      profileCompleted: user.profileCompletedAt != null,
    }
  })
})

app.post('/api/v1/auth/login', async (request, reply) => {
  const { email , password } = request.body as {
    email?: string
    password?: string
  }

  if(!email?.trim() || !password){
    return reply.code(400).send({ error: 'Email and password are required'})
  }

  const normalizedEmail = email.trim().toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  const invalidCredentials = () =>
    reply.code(401).send({ error: 'Invalid email or password' })

  if (!user) {
    return invalidCredentials()
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)

  if (!passwordMatches) {
    return invalidCredentials()
  }

  const token = app.jwt.sign({ sub : user.id})

  reply.setCookie('token', token,{
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production'
  })

  return reply.send({
    user: {
      id: user.id,
      email: user.email,
      profileCompleted: user.profileCompletedAt != null,
    },
  })
})

app.get('/api/v1/auth/me', async (request, reply) => {
  const user = await requireUser(app, request, reply)
  if (!user) return
  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      birthDate: user.birthDate,
      profileCompleted: user.profileCompletedAt != null,
    },
  }
})

app.patch('/api/v1/auth/me/profile', async (request, reply) => {
  const currentUser = await requireUser(app, request, reply)
  if (!currentUser) return

  const body = request.body as {
    username?: string
    displayName?: string
    birthDate?: string
  }

  const username = body.username?.trim()

  if (!username) {
    return reply.code(400).send({ error: 'Username is required' })
  }

  if (username.length < 3) {
    return reply.code(400).send({ error: 'Username must be at least 3 characters' })
  }

  const taken = await prisma.user.findUnique({
    where: { username },
  })

  if (taken && taken.id !== currentUser.id) {
    return reply.code(409).send({ error: 'Username already taken' })
  }

  const displayName = body.displayName?.trim() || username

  let birthDate: Date | undefined
  if (body.birthDate) {
    birthDate = new Date(body.birthDate)
    if (Number.isNaN(birthDate.getTime())) {
      return reply.code(400).send({ error: 'Invalid birth date' })
    }
  }

  const user = await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      username,
      displayName,
      ...(birthDate ? { birthDate } : {}),
      profileCompletedAt: new Date(),
    },
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      birthDate: user.birthDate,
      profileCompleted: user.profileCompletedAt != null,
    },
  }
})

app.get('/api/v1/users', async (request,reply) => {
  const currentUser = await requireUser(app,request,reply)
  if(!currentUser)return

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      username: {not: null},
    },
    select: {
      id:true,
      username:true,
      displayName:true,
      avatarUrl:true,
    },
    orderBy: {username: 'asc'},
  })

  return {users}
})

app.post('/api/v1/threads',async (request,reply) => {
  const currentUser = await requireUser(app,request,reply)
  if(!currentUser) return

  const { peerUserId } = request.body as { peerUserId?: string}

  if(!peerUserId) {
    return reply.code(400).send({error: 'peerUserId is required'})
  }

  if(peerUserId === currentUser.id){
    return reply.code(400).send({error:'Cannot create a thread with yourself'})
  }

  const peer = await prisma.user.findUnique({
    where: {id: peerUserId},
  })

  if(!peer || peer.deletedAt || !peer.username){
    return reply.code(401).send({error: 'User not found'})
  }

  const [userLowId , userHighId] = orderUserPair(currentUser.id , peer.id)

  const thread = await prisma.thread.upsert({
    where:{
      userLowId_userHighId:{
        userLowId,
        userHighId,
      },
    },
    create:{
      userLowId,
      userHighId,
    },
    update: {},
  })

  return {
    thread: {
      id: thread.id,
      createdAt: thread.createdAt,
      peer:{
        id: peer.id,
        username: peer.username,
        displayName: peer.displayName,
        avatarUrl: peer.avatarUrl,
      },
    },
  }
})

app.post('/api/v1/threads/:id/messages', async (request,reply) => {
  const currentUser = await requireUser(app,request,reply)
  if(!currentUser) return

  const { id: threadId } = request.params as {id:string}
  const { body } = request.body as {body?: string}

  const text = body?.trim()
  if(!text){
    return reply.code(400).send({error: 'Message body is required'})
  }

  const thread = await prisma.thread.findUnique({
    where: {id: threadId},
  })

  if(!thread){
    return reply.code(404).send({error:'thread not found'})
  }

  const isParticipant =
  thread.userLowId === currentUser.id ||
  thread.userHighId === currentUser.id

  if(!isParticipant) {
    return reply.code(403).send({error: 'Now allowed in this thread'})
  }

  const message = await prisma.message.create({
    data:{
      threadId,
      senderId: currentUser.id,
      body: text,
    },
  })

  return reply.code(201).send({
    message: {
      id: message.id,
      threadid: message.threadId,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt,
    },
  })
})

app.get('/api/v1/threads/:id/messages',async (request,reply) => {
  const currentUser = await requireUser(app,request,reply)
  if(!currentUser) return 

  const {id: threadId} = request.params as { id: string }

  const thread = await prisma.thread.findUnique({
    where: {id: threadId},
  })

  if(!thread){
    return reply.code(404).send({error: 'Thread not found'})
  }

  const isParticipant = 
  thread.userLowId === currentUser.id ||
  thread.userHighId === currentUser.id

  if(!isParticipant){
    return reply.code(403).send({error: 'Not allowed in this thread'})
  }

  const messages = await prisma.message.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc'},
    select:{
      id: true,
      threadId: true,
      senderId: true,
      body: true,
      createdAt: true,
    },
  })

  return { messages }
})

app.get('/api/v1/threads', async (request,reply) => {
  const currentUser = await requireUser(app,request,reply)
  if(!currentUser) return

  const threads = await prisma.thread.findMany({
    where:{
      OR: [
        {userLowId: currentUser.id},
        {userHighId: currentUser.id},
      ],
    },
    orderBy: {createdAt: 'desc'},
    include: {
      userLow:{
        select: {id:true , username: true , displayName: true , avatarUrl:true},
      },
      userHigh:{
        select: {id:true , username: true , displayName: true , avatarUrl:true},
      },
      messages:{
        orderBy: {createdAt: 'desc'},
        take: 1,
        select: {id: true , body: true , senderId: true , createdAt: true},
      },
    },
  })

  const list = threads.map((thread) => {
    const peer = 
    thread.userLowId === currentUser.id ? thread.userHigh : thread.userLow

    const lastMessage = thread.messages[0] ?? null

    return {
      id: thread.id,
      createdAt: thread.createdAt,
      peer,
      lastMessage,
    }
  })

  return { threads: list}
})

app.post('/api/v1/auth/logout' , async (_request, reply) => {
  reply.clearCookie('token', {
    path:'/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })

  return { ok : true }
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