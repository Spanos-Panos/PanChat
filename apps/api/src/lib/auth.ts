import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { User } from "@prisma/client";
import {
  isEmailVerificationRequired,
  userEmailIsVerified,
} from "./auth-policy.js";
import { authenticateSessionToken } from "./session.js";

export async function requireUser(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<User | null> {
  const token = request.cookies.token;

  if (!token) {
    reply.code(401).send({ error: "Not authenticated" });
    return null;
  }

  const user = await authenticateSessionToken(app, token);

  if (!user) {
    reply.code(401).send({ error: "Not authenticated" });
    return null;
  }

  if (isEmailVerificationRequired() && !userEmailIsVerified(user)) {
    reply.code(403).send({
      error: "Please verify your email before continuing.",
      code: "EMAIL_NOT_VERIFIED",
    });
    return null;
  }

  return user;
}
