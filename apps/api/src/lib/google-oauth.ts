import type { FastifyInstance } from "fastify";
import oauthPlugin from "@fastify/oauth2";

const GOOGLE_OAUTH = {
  authorizeHost: "https://accounts.google.com",
  authorizePath: "/o/oauth2/v2/auth",
  tokenHost: "https://oauth2.googleapis.com",
  tokenPath: "/token",
} as const;
import { prisma } from "./prisma.js";
import {
  apiPublicOrigin,
  isGoogleAuthEnabled,
  webOrigin,
} from "./auth-policy.js";
import { setSessionCookie } from "./auth-cookies.js";
import { normalizeEmail } from "./validate.js";

type GoogleProfile = {
  id: string;
  email?: string;
  verified_email?: boolean;
};

export async function registerGoogleAuth(app: FastifyInstance): Promise<void> {
  if (!isGoogleAuthEnabled()) {
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!.trim();
  const callbackUri = `${apiPublicOrigin()}/api/v1/auth/google/callback`;

  await app.register(oauthPlugin, {
    name: "googleOAuth2",
    credentials: {
      client: { id: clientId, secret: clientSecret },
      auth: GOOGLE_OAUTH,
    },
    startRedirectPath: "/api/v1/auth/google",
    callbackUri,
    scope: ["email", "profile"],
  });

  app.get("/api/v1/auth/google/callback", async (request, reply) => {
    const fail = (message: string) =>
      reply.redirect(`${webOrigin()}/?auth_error=${encodeURIComponent(message)}`);

    try {
      const { token } =
        await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

      const profileRes = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: { Authorization: `Bearer ${token.access_token}` },
        },
      );

      if (!profileRes.ok) {
        return fail("Could not read Google profile");
      }

      const profile = (await profileRes.json()) as GoogleProfile;
      const normalizedEmail = profile.email
        ? normalizeEmail(profile.email)
        : null;

      if (!normalizedEmail || profile.verified_email === false) {
        return fail("Google did not provide a verified email");
      }

      const googleId = profile.id;
      const existingAccount = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: googleId,
          },
        },
        include: { user: true },
      });

      let user = existingAccount?.user ?? null;

      if (!user) {
        const byEmail = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (byEmail) {
          if (byEmail.deletedAt) {
            return fail("Account was deleted");
          }
          user = byEmail;
          await prisma.account.create({
            data: {
              userId: user.id,
              provider: "google",
              providerAccountId: googleId,
            },
          });
          if (!user.emailVerifiedAt) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { emailVerifiedAt: new Date() },
            });
          }
        } else {
          const now = new Date();
          user = await prisma.user.create({
            data: {
              email: normalizedEmail,
              emailVerifiedAt: now,
              accounts: {
                create: {
                  provider: "google",
                  providerAccountId: googleId,
                },
              },
            },
          });
        }
      }

      if (user.deletedAt) {
        return fail("Account was deleted");
      }

      setSessionCookie(app, reply, user);
      return reply.redirect(`${webOrigin()}/?signed_in=1`);
    } catch (err) {
      request.log.error(err);
      return fail("Google sign-in failed");
    }
  });
}
