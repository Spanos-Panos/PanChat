import type { FastifyInstance } from "fastify";
import type { User } from "@prisma/client";
import { prisma } from "./prisma.js";

/** Unix ms — embedded in JWT so password resets revoke old cookies. */
export function sessionPasswordStamp(user: {
  passwordChangedAt: Date | null;
  createdAt: Date;
}): number {
  return (user.passwordChangedAt ?? user.createdAt).getTime();
}

export function signSessionToken(app: FastifyInstance, user: User): string {
  return app.jwt.sign({
    sub: user.id,
    pwd: sessionPasswordStamp(user),
  });
}

type JwtPayload = { sub: string; pwd?: number; iat?: number };

export function isSessionTokenValidForUser(
  payload: JwtPayload,
  user: User,
): boolean {
  const stamp = sessionPasswordStamp(user);

  if (payload.pwd !== undefined) {
    return payload.pwd === stamp;
  }

  // Tokens issued before passwordChangedAt was added: honor JWT `iat`.
  if (payload.iat !== undefined) {
    return payload.iat * 1000 >= stamp;
  }

  return false;
}

export async function authenticateSessionToken(
  app: FastifyInstance,
  token: string,
): Promise<User | null> {
  let payload: JwtPayload;

  try {
    payload = await app.jwt.verify<JwtPayload>(token);
  } catch {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user || user.deletedAt) {
    return null;
  }

  if (!isSessionTokenValidForUser(payload, user)) {
    return null;
  }

  return user;
}
