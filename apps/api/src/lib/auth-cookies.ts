import type { FastifyInstance, FastifyReply } from "fastify";
import type { User } from "@prisma/client";
import { signSessionToken } from "./session.js";

export function setSessionCookie(
  app: FastifyInstance,
  reply: FastifyReply,
  user: User,
): void {
  const token = signSessionToken(app, user);
  reply.setCookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie("token", { path: "/" });
}
