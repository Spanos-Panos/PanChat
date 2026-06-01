import type { FastifyInstance, FastifyReply } from "fastify";
import type { User } from "@prisma/client";
import { signSessionToken } from "./session.js";

function sessionCookieOptions(): {
  httpOnly: true;
  sameSite: "lax" | "strict" | "none";
  path: "/";
  secure: boolean;
} {
  const isProd = process.env.NODE_ENV === "production";
  const crossSite = process.env.COOKIE_CROSS_SITE === "true";
  return {
    httpOnly: true,
    sameSite: crossSite && isProd ? "none" : "lax",
    path: "/",
    secure: isProd,
  };
}

export function setSessionCookie(
  app: FastifyInstance,
  reply: FastifyReply,
  user: User,
): void {
  const token = signSessionToken(app, user);
  reply.setCookie("token", token, sessionCookieOptions());
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie("token", { path: "/" });
}
