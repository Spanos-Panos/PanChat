import type { FastifyInstance, FastifyReply , FastifyRequest } from "fastify";  
import type { User } from '@prisma/client'
import { prisma } from './prisma.js'

export async function requireUser(
    app: FastifyInstance,
    request: FastifyRequest,
    reply: FastifyReply

): Promise< User | null > {
    const token = request.cookies.token

    if(!token){
        reply.code(401).send({error: 'Not authenticated'})
        return null
    }

    let payload : {sub: string}

    try{
        payload = await app.jwt.verify<{sub: string}>(token)
    } catch {
        reply.code(401).send({error: 'Not authenticated'})
        return null
    }

    const user = await prisma.user.findUnique({
        where: {id: payload.sub},
    })

    if(!user || user.deletedAt){
        reply.code(401).send({error:'Not authenticated'})
        return null
    }

    return user
}