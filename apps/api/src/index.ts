import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "./lib/prisma.js";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import bcrypt from "bcrypt";
import { requireUser } from "./lib/auth.js";
import {
  normalizeEmail,
  parseBirthDate,
  parseDisplayName,
  parseMessageBody,
  parseTaskBody,
  parseTaskStatus,
  parseUsername,
  parseUuid,
  validatePassword,
} from "./lib/validate.js";
import { randomBytes } from "node:crypto";
import type { FastifyReply } from "fastify";
import {
  createPasswordResetToken,
  hashResetToken,
} from "./lib/reset-token.js";
import {
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
} from "./lib/mail.js";
import {
  authenticateSessionToken,
  signSessionToken,
} from "./lib/session.js";
import { setSessionCookie, clearSessionCookie } from "./lib/auth-cookies.js";
import { serializeAuthUser } from "./lib/auth-serialize.js";
import {
  isEmailVerificationRequired,
  isGoogleAuthEnabled,
  isAllowedWebOrigin,
  webOrigin,
  webOrigins,
} from "./lib/auth-policy.js";
import { issueEmailVerification, verifyEmailWithToken } from "./lib/email-verification.js";
import { registerGoogleAuth } from "./lib/google-oauth.js";

const PASSWORD_RESET_GENERIC_MSG =
  "If that email is registered, you will receive a reset link shortly.";

type PasswordResetHint = {
  status: "not_found" | "invalid_email" | "deleted" | "email_sent" | "dev_link";
  devResetUrl?: string;
};

function passwordResetResponse(
  reply: FastifyReply,
  message: string,
  hint?: PasswordResetHint,
) {
  if (process.env.NODE_ENV === "production" || !hint) {
    return reply.send({ ok: true, message: PASSWORD_RESET_GENERIC_MSG });
  }
  return reply.send({ ok: true, message, hint });
}
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import {mkdir , writeFile} from "node:fs/promises";
import {join , extname} from "node:path";
import { Server } from "socket.io";

let io: Server | undefined;
const onlineCounts = new Map<string, number>();

function orderUserPair(idA: string, idB: string): [string, string] {
  return idA < idB ? [idA, idB] : [idB, idA];
}

/** Same user shape for login, register, /me, and profile — includes avatarUrl. */
function requireUuid(
  raw: string | undefined,
  reply: FastifyReply,
): string | null {
  const id = parseUuid(raw);
  if (!id) {
    reply.code(400).send({ error: "Invalid id" });
    return null;
  }
  return id;
}

type MessageWithTask = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  deletedForEveryone: boolean;
  createdAt: Date;
  task: {
    id: string;
    body: string;
    status: string;
    assigneeId: string;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

function shapeMessageForViewer(message: MessageWithTask, viewerId: string) {
  const base = {
    id: message.id,
    threadId: message.threadId,
    senderId: message.senderId,
    body: message.deletedForEveryone ? "" : message.body,
    deletedForEveryone: message.deletedForEveryone,
    createdAt: message.createdAt,
  };

  // A deleted-for-everyone message shows a tombstone, never its task/body.
  if (message.deletedForEveryone) return base;

  if (!message.task) return base;

  if (message.task.assigneeId === viewerId) {
    return {
      ...base,
      task: {
        id: message.task.id,
        body: message.task.body,
        status: message.task.status,
        createdAt: message.task.createdAt,
        updatedAt: message.task.updatedAt,
      },
    };
  }

  return { ...base, hasTask: true };
}

// Load PanChat root .env
const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET is missing in root .env");
}

const host = process.env.API_HOST ?? "0.0.0.0";
// Railway (and most PaaS) set PORT; local dev uses API_PORT or 4000
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);

const isProduction = process.env.NODE_ENV === "production";

const app = Fastify({
  logger: true,
  bodyLimit: 1_048_576,
  trustProxy: isProduction || process.env.TRUST_PROXY === "true",
});

await app.register(helmet, {
  contentSecurityPolicy: isProduction,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

const rateLimitMax = Number(process.env.RATE_LIMIT_MAX ?? 200);
const rateLimitWindow = process.env.RATE_LIMIT_WINDOW ?? "1 minute";
const authRateLimitMax = Number(process.env.AUTH_RATE_LIMIT_MAX ?? 15);

await app.register(rateLimit, {
  global: true,
  max: rateLimitMax,
  timeWindow: rateLimitWindow,
  allowList: (request) => request.url === "/health",
});

app.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  const err = error as { statusCode?: number; message?: string };
  const statusCode = err.statusCode ?? 500;
  if (statusCode >= 500 && isProduction) {
    return reply.code(500).send({ error: "Internal server error" });
  }
  return reply.code(statusCode).send({
    error: err.message || "Request failed",
  });
});

await app.register(cors, {
  origin: (origin, cb) => {
    if (isAllowedWebOrigin(origin)) {
      cb(null, true);
      return;
    }
    cb(null, false);
  },
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
});

await app.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadsRoot = join(__dirname, "../uploads");
await mkdir(join(uploadsRoot, "avatars"), { recursive: true });

await app.register(fastifyStatic, {
  root: uploadsRoot,
  prefix: "/uploads/",
});

await app.register(cookie);

await app.register(jwt, {
  secret: jwtSecret,
});

await registerGoogleAuth(app);

app.get("/api/v1/auth/providers", async () => {
  return {
    google: isGoogleAuthEnabled(),
    emailVerificationRequired: isEmailVerificationRequired(),
  };
});

app.get("/health", async () => {
  return { ok: true };
});

app.get("/health/db", async () => {
  await prisma.$queryRaw`SELECT 1`;
  return { ok: true, database: "connected" };
});

app.post(
  "/api/v1/auth/register",
  {
    config: {
      rateLimit: { max: authRateLimitMax, timeWindow: "15 minutes" },
    },
  },
  async (request, reply) => {
  const { email, password } = request.body as {
    email?: string;
    password?: string;
  };

  if (!email?.trim() || !password) {
    return reply.code(400).send({ error: "Email and password required" });
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return reply.code(400).send({ error: "Invalid email address" });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return reply.code(400).send({ error: passwordError });
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return reply.code(409).send({ error: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const requireVerify = isEmailVerificationRequired();
  const now = new Date();

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      emailVerifiedAt: requireVerify ? null : now,
      accounts: {
        create: {
          provider: "credential",
          providerAccountId: normalizedEmail,
        },
      },
    },
  });

  if (requireVerify) {
    try {
      const { verifyUrl } = await issueEmailVerification(user.id, user.email);
      const exposeDevLink =
        process.env.EXPOSE_DEV_VERIFY_LINK_IN_UI === "true";
      return reply.code(201).send({
        needsEmailVerification: true,
        message:
          "Check your email for a verification link before signing in.",
        email: user.email,
        ...(exposeDevLink && !isProduction
          ? { devVerifyUrl: verifyUrl }
          : {}),
      });
    } catch (err) {
      request.log.error(err);
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
      return reply
        .code(503)
        .send({ error: "Could not send verification email. Try again." });
    }
  }

  setSessionCookie(app, reply, user);

  return reply.code(201).send({
    user: serializeAuthUser(user),
  });
  },
);

app.post(
  "/api/v1/auth/login",
  {
    config: {
      rateLimit: { max: authRateLimitMax, timeWindow: "15 minutes" },
    },
  },
  async (request, reply) => {
  const { email, password } = request.body as {
    email?: string;
    password?: string;
  };

  if (!email?.trim() || !password) {
    return reply.code(400).send({ error: "Email and password are required" });
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return reply.code(401).send({ error: "Invalid email or password" });
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  const invalidCredentials = () =>
    reply.code(401).send({ error: "Invalid email or password" });

  if (!user || user.deletedAt) {
    return invalidCredentials();
  }

  if (!user.passwordHash) {
    const googleLinked = await prisma.account.findFirst({
      where: { userId: user.id, provider: "google" },
    });
    if (googleLinked) {
      return reply.code(401).send({
        error: "This account uses Google sign-in.",
        code: "USE_GOOGLE_SIGN_IN",
      });
    }
    return invalidCredentials();
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return invalidCredentials();
  }

  if (isEmailVerificationRequired() && !user.emailVerifiedAt) {
    return reply.code(403).send({
      error: "Verify your email before signing in. Check your inbox or resend the link.",
      code: "EMAIL_NOT_VERIFIED",
      email: user.email,
    });
  }

  setSessionCookie(app, reply, user);

  return reply.send({
    user: serializeAuthUser(user),
  });
  },
);

app.post(
  "/api/v1/auth/verify-email",
  {
    config: {
      rateLimit: { max: 20, timeWindow: "15 minutes" },
    },
  },
  async (request, reply) => {
    const { token } = request.body as { token?: string };
    if (!token?.trim()) {
      return reply.code(400).send({ error: "Verification token is required" });
    }

    const result = await verifyEmailWithToken(token.trim());
    if (!result.ok) {
      return reply.code(400).send({ error: result.error });
    }

    const user = await prisma.user.findUnique({
      where: { id: result.userId },
    });
    if (!user || user.deletedAt) {
      return reply.code(400).send({ error: "Invalid or expired verification link" });
    }

    setSessionCookie(app, reply, user);

    return reply.send({
      ok: true,
      message: "Email verified. You are signed in.",
      user: serializeAuthUser(user),
    });
  },
);

app.post(
  "/api/v1/auth/resend-verification",
  {
    config: {
      rateLimit: { max: 5, timeWindow: "15 minutes" },
    },
  },
  async (request, reply) => {
    const { email } = request.body as { email?: string };
    if (!email?.trim()) {
      return reply.code(400).send({ error: "Email is required" });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return reply.send({
        ok: true,
        message: "If that account needs verification, we sent a new link.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.deletedAt || user.emailVerifiedAt) {
      return reply.send({
        ok: true,
        message: "If that account needs verification, we sent a new link.",
      });
    }

    try {
      const { verifyUrl } = await issueEmailVerification(user.id, user.email);
      const exposeDevLink =
        process.env.EXPOSE_DEV_VERIFY_LINK_IN_UI === "true";
      return reply.send({
        ok: true,
        message: "If that account needs verification, we sent a new link.",
        ...(!isProduction && exposeDevLink ? { devVerifyUrl: verifyUrl } : {}),
      });
    } catch (err) {
      request.log.error(err);
      return reply
        .code(503)
        .send({ error: "Could not send verification email. Try again." });
    }
  },
);

app.post(
  "/api/v1/auth/me/change-password",
  {
    config: {
      rateLimit: { max: 10, timeWindow: "15 minutes" },
    },
  },
  async (request, reply) => {
    const currentUser = await requireUser(app, request, reply);
    if (!currentUser) return;

    if (!currentUser.passwordHash) {
      return reply.code(400).send({
        error: "Password sign-in is not set for this account. Use Google or reset password via email.",
      });
    }

    const { currentPassword, newPassword } = request.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return reply
        .code(400)
        .send({ error: "Current password and new password are required" });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return reply.code(400).send({ error: passwordError });
    }

    const matches = await bcrypt.compare(
      currentPassword,
      currentUser.passwordHash,
    );
    if (!matches) {
      return reply.code(401).send({ error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const now = new Date();

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: { passwordHash, passwordChangedAt: now },
    });

    try {
      await sendPasswordChangedEmail(user.email);
    } catch (err) {
      request.log.warn(err, "Password changed alert email failed");
    }

    setSessionCookie(app, reply, user);

    return reply.send({
      ok: true,
      message: "Password updated.",
      user: serializeAuthUser(user),
    });
  },
);

app.post(
  "/api/v1/auth/forgot-password",
  {
    config: {
      rateLimit: { max: 5, timeWindow: "15 minutes" },
    },
  },
  async (request, reply) => {
    const { email } = request.body as { email?: string };

    if (!email?.trim()) {
      return reply.code(400).send({ error: "Email is required" });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return passwordResetResponse(
        reply,
        "That does not look like a valid email address.",
        { status: "invalid_email" },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return passwordResetResponse(
        reply,
        "No PanChat account uses this email. Check for typos, or create an account.",
        { status: "not_found" },
      );
    }

    if (user.deletedAt) {
      return passwordResetResponse(
        reply,
        "This account was deleted. Sign up again with a different email if you want a new account.",
        { status: "deleted" },
      );
    }

    const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());

    if (isProduction && !hasResend) {
      request.log.error(
        "Password reset blocked: RESEND_API_KEY is required in production",
      );
      return reply.code(503).send({
        error:
          "Password reset is temporarily unavailable. Please try again later.",
      });
    }

    const { rawToken, tokenHash, expiresAt } = createPasswordResetToken();

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const resetUrl = `${webOrigin()}/?reset=${rawToken}`;
    const exposeDevLinkInUi =
      process.env.EXPOSE_DEV_RESET_LINK_IN_UI === "true";

    try {
      await sendPasswordResetEmail({ to: user.email, resetUrl });
    } catch (err) {
      request.log.error(err);
      return reply
        .code(503)
        .send({ error: "Could not send reset email. Try again later." });
    }

    if (!hasResend) {
      return passwordResetResponse(
        reply,
        exposeDevLinkInUi
          ? "Account found. Reset link below (dev only — also in API terminal)."
          : "Account found. For safety the reset link is only in the API terminal (not in this browser). Set EXPOSE_DEV_RESET_LINK_IN_UI=true in .env only on your private machine if you need it here.",
        exposeDevLinkInUi
          ? { status: "dev_link", devResetUrl: resetUrl }
          : { status: "dev_link" },
      );
    }

    return passwordResetResponse(
      reply,
      "Reset email sent. Check your inbox and spam folder.",
      { status: "email_sent" },
    );
  },
);

app.post(
  "/api/v1/auth/reset-password",
  {
    config: {
      rateLimit: { max: 10, timeWindow: "15 minutes" },
    },
  },
  async (request, reply) => {
    const { token, password } = request.body as {
      token?: string;
      password?: string;
    };

    if (!token?.trim() || !password) {
      return reply
        .code(400)
        .send({ error: "Reset token and new password are required" });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return reply.code(400).send({ error: passwordError });
    }

    const tokenHash = hashResetToken(token.trim());
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !resetRecord ||
      resetRecord.usedAt ||
      resetRecord.expiresAt < new Date() ||
      resetRecord.user.deletedAt
    ) {
      return reply.code(400).send({ error: "Invalid or expired reset link" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash,
          passwordChangedAt: now,
          emailVerifiedAt: resetRecord.user.emailVerifiedAt ?? now,
        },
      });
      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: now },
      });
      return u;
    });

    try {
      await sendPasswordChangedEmail(updatedUser.email);
    } catch (err) {
      request.log.warn(err, "Password changed alert email failed");
    }

    clearSessionCookie(reply);

    return reply.send({
      ok: true,
      message:
        "Password updated. Sign in with your new password. Any other devices were signed out.",
    });
  },
);

app.get("/api/v1/auth/me", async (request, reply) => {
  const user = await requireUser(app, request, reply);
  if (!user) return;
  return { user: serializeAuthUser(user) };
});

app.patch("/api/v1/auth/me/profile", async (request, reply) => {
  const currentUser = await requireUser(app, request, reply);
  if (!currentUser) return;

  const body = request.body as {
    username?: string;
    displayName?: string;
    birthDate?: string;
  };

  const parsedUsername = parseUsername(body.username ?? "");
  if ("error" in parsedUsername) {
    return reply.code(400).send({ error: parsedUsername.error });
  }
  const username = parsedUsername.value;

  const taken = await prisma.user.findUnique({
    where: { username },
  });

  if (taken && taken.id !== currentUser.id) {
    return reply.code(409).send({ error: "Username already taken" });
  }

  let displayName = username;
  if (body.displayName?.trim()) {
    const parsedDisplay = parseDisplayName(body.displayName);
    if (!parsedDisplay) {
      return reply.code(400).send({ error: "Display name is too long" });
    }
    displayName = parsedDisplay;
  }

  let birthDate: Date | undefined;
  if (body.birthDate?.trim()) {
    const parsedBirth = parseBirthDate(body.birthDate);
    if (parsedBirth && "error" in parsedBirth) {
      return reply.code(400).send({ error: parsedBirth.error });
    }
    if (parsedBirth && "value" in parsedBirth) {
      birthDate = parsedBirth.value;
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
  });

  return { user: serializeAuthUser(user) };
});

app.get("/api/v1/auth/me/export", async (request, reply) => {
  const currentUser = await requireUser(app, request, reply);
  if (!currentUser) return;

  const [messagesSent, tasksAssigned, tasksCreated] = await Promise.all([
    prisma.message.findMany({
      where: { senderId: currentUser.id },
      select: {
        id: true,
        threadId: true,
        body: true,
        deletedForEveryone: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.task.findMany({
      where: { assigneeId: currentUser.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.task.findMany({
      where: { createdById: currentUser.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    account: serializeAuthUser(currentUser),
    messagesSent,
    tasksAssignedToYou: tasksAssigned,
    tasksYouCreated: tasksCreated,
  };
});

app.post(
  "/api/v1/auth/me/delete",
  {
    config: {
      rateLimit: { max: 5, timeWindow: "1 hour" },
    },
  },
  async (request, reply) => {
    const currentUser = await requireUser(app, request, reply);
    if (!currentUser) return;

    const { confirmEmail } = request.body as { confirmEmail?: string };
    const normalized = confirmEmail?.trim().toLowerCase();

    if (!normalized || normalized !== currentUser.email) {
      return reply
        .code(400)
        .send({ error: "Confirm your email address to delete the account" });
    }

    const tombstoneEmail = `deleted+${currentUser.id}@deleted.panchat.local`;
    const randomPassword = randomBytes(32).toString("hex");

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        deletedAt: new Date(),
        email: tombstoneEmail,
        username: null,
        displayName: "Deleted user",
        avatarUrl: null,
        birthDate: null,
        passwordHash: await bcrypt.hash(randomPassword, 10),
      },
    });

    reply.clearCookie("token", {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return { ok: true };
  },
);

const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

app.post("/api/v1/auth/me/avatar", async (request, reply) => {
  const currentUser = await requireUser(app, request, reply);
  if (!currentUser) return;

  const file = await request.file();
  if (!file) {
    return reply.code(400).send({ error: "No file uploaded" });
  }

  if (!ALLOWED_AVATAR_TYPES.has(file.mimetype)) {
    return reply.code(400).send({ error: "File must be JPEG, PNG, or WebP" });
  }

  const ext =
    file.mimetype === "image/jpeg"
      ? ".jpg"
      : file.mimetype === "image/png"
        ? ".png"
        : ".webp";

  const filename = `${currentUser.id}${ext}`;
  const diskPath = join(uploadsRoot, "avatars", filename);
  const buffer = await file.toBuffer();
  await writeFile(diskPath, buffer);

  const avatarUrl = `/uploads/avatars/${filename}`;

  const user = await prisma.user.update({
    where: { id: currentUser.id },
    data: { avatarUrl },
  });

  if (io) {
    io.emit("user:updated", {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      version: Date.now(),
    });
  }

  return { user: serializeAuthUser(user) };
});

app.get("/api/v1/users", async (request, reply) => {
  const currentUser = await requireUser(app, request, reply);
  if (!currentUser) return;

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      username: { not: null },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
    orderBy: { username: "asc" },
  });

  return { users };
});

app.post("/api/v1/threads", async (request, reply) => {
  const currentUser = await requireUser(app, request, reply);
  if (!currentUser) return;

  const { peerUserId: rawPeerId } = request.body as { peerUserId?: string };
  const peerUserId = requireUuid(rawPeerId, reply);
  if (!peerUserId) return;

  if (peerUserId === currentUser.id) {
    return reply
      .code(400)
      .send({ error: "Cannot create a thread with yourself" });
  }

  const peer = await prisma.user.findUnique({
    where: { id: peerUserId },
  });

  if (!peer || peer.deletedAt || !peer.username) {
    return reply.code(404).send({ error: "User not found" });
  }

  const [userLowId, userHighId] = orderUserPair(currentUser.id, peer.id);

  const thread = await prisma.thread.upsert({
    where: {
      userLowId_userHighId: {
        userLowId,
        userHighId,
      },
    },
    create: {
      userLowId,
      userHighId,
    },
    update: {},
  });

  return {
    thread: {
      id: thread.id,
      createdAt: thread.createdAt,
      peer: {
        id: peer.id,
        username: peer.username,
        displayName: peer.displayName,
        avatarUrl: peer.avatarUrl,
      },
    },
  };
});

app.post("/api/v1/threads/:id/messages", async (request, reply) => {
  const currentUser = await requireUser(app, request, reply);
  if (!currentUser) return;

  const { id: rawThreadId } = request.params as { id: string };
  const threadId = requireUuid(rawThreadId, reply);
  if (!threadId) return;

  const { body, task } = request.body as {
    body?: string;
    task?: { body?: string };
  };

  const parsedMessage = parseMessageBody(body ?? "");
  if ("error" in parsedMessage) {
    return reply.code(400).send({ error: parsedMessage.error });
  }
  const text = parsedMessage.value;

  let taskText: string | undefined;
  if (task) {
    const parsedTask = parseTaskBody(task.body ?? "");
    if ("error" in parsedTask) {
      return reply.code(400).send({ error: parsedTask.error });
    }
    taskText = parsedTask.value;
  }

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
  });

  if (!thread) {
    return reply.code(404).send({ error: "thread not found" });
  }

  const isParticipant =
    thread.userLowId === currentUser.id || thread.userHighId === currentUser.id;

  if (!isParticipant) {
    return reply.code(403).send({ error: "Now allowed in this thread" });
  }

  const assigneeId =
    thread.userLowId === currentUser.id ? thread.userHighId : thread.userLowId;

  const message = await prisma.message.create({
    data: {
      threadId,
      senderId: currentUser.id,
      body: text,
      ...(taskText
        ? {
            task: {
              create: {
                body: taskText,
                assigneeId,
                createdById: currentUser.id,
              },
            },
          }
        : {}),
    },
    include: { task: true },
  });

  const peerId =
  thread.userLowId === currentUser.id
    ? thread.userHighId
    : thread.userLowId;

if (io) {
  io.to(`user:${peerId}`).emit("message:new", {
    threadId,
    message: shapeMessageForViewer(message, peerId),
  });
}

  return reply.code(201).send({
    message: {
      id: message.id,
      threadId: message.threadId,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt,
      ...(message.task ? { hasTask: true } : {}),
    },
  });
});

app.get("/api/v1/threads/:id/messages", async (request, reply) => {
  const currentUser = await requireUser(app, request, reply);
  if (!currentUser) return;

  const { id: rawThreadId } = request.params as { id: string };
  const threadId = requireUuid(rawThreadId, reply);
  if (!threadId) return;

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
  });

  if (!thread) {
    return reply.code(404).send({ error: "Thread not found" });
  }

  const isParticipant =
    thread.userLowId === currentUser.id || thread.userHighId === currentUser.id;

  if (!isParticipant) {
    return reply.code(403).send({ error: "Not allowed in this thread" });
  }

  const messages = await prisma.message.findMany({
    where: {
      threadId,
      // Exclude messages this viewer has "deleted for me".
      hides: { none: { userId: currentUser.id } },
    },
    orderBy: { createdAt: "asc" },
    include: { task: true },
  });

  const shaped = messages.map((m) => {
    const base = {
      id: m.id,
      threadId: m.threadId,
      senderId: m.senderId,
      body: m.deletedForEveryone ? "" : m.body,
      deletedForEveryone: m.deletedForEveryone,
      createdAt: m.createdAt,
    };

    if (m.deletedForEveryone) {
      return base;
    }

    if (!m.task) {
      return base;
    }

    if (m.task.assigneeId === currentUser.id) {
      return {
        ...base,
        task: {
          id: m.task.id,
          body: m.task.body,
          status: m.task.status,
          createdAt: m.task.createdAt,
          updatedAt: m.task.updatedAt,
        },
      };
    }

    return { ...base, hasTask: true };
  });

  return { messages: shaped };
});

app.delete("/api/v1/messages/:id", async (request, reply) => {
  const currentUser = await requireUser(app, request, reply);
  if (!currentUser) return;

  const { id: rawId } = request.params as { id: string };
  const id = requireUuid(rawId, reply);
  if (!id) return;

  const scope = (request.query as { scope?: string }).scope ?? "me";

  if (scope !== "me" && scope !== "everyone") {
    return reply.code(400).send({ error: "scope must be 'me' or 'everyone'" });
  }

  const message = await prisma.message.findUnique({
    where: { id },
    include: { thread: true, task: true },
  });

  if (!message) {
    return reply.code(404).send({ error: "Message not found" });
  }

  const { thread } = message;
  const isParticipant =
    thread.userLowId === currentUser.id || thread.userHighId === currentUser.id;

  if (!isParticipant) {
    return reply.code(403).send({ error: "Not allowed in this thread" });
  }

  if (scope === "everyone") {
    if (message.senderId !== currentUser.id) {
      return reply
        .code(403)
        .send({ error: "You can only delete your own messages for everyone" });
    }

    await prisma.$transaction(async (tx) => {
      if (message.task) {
        await tx.task.delete({ where: { id: message.task.id } });
      }
      await tx.message.update({
        where: { id },
        data: { deletedForEveryone: true, body: "" },
      });
    });

    if (io) {
      // Notify both participants (every tab/device) so the deletion shows
      // live for the sender's other sessions and the recipient alike.
      io.to(`user:${thread.userLowId}`)
        .to(`user:${thread.userHighId}`)
        .emit("message:deleted", {
          threadId: thread.id,
          messageId: id,
        });
    }

    return { ok: true, scope: "everyone" };
  }

  // "delete for me": hide the message from this viewer only.
  await prisma.messageHide.upsert({
    where: { messageId_userId: { messageId: id, userId: currentUser.id } },
    create: { messageId: id, userId: currentUser.id },
    update: {},
  });

  return { ok: true, scope: "me" };
});

app.get("/api/v1/tasks/inbox", async (request, reply) => {
  const currentUser = await requireUser(app, request, reply);
  if (!currentUser) return;

  const statusParam = (request.query as { status?: string }).status;

  const where: { assigneeId: string; status?: "open" | "cleared" | "deleted" } =
    {
      assigneeId: currentUser.id,
    };

  if (
    statusParam === "open" ||
    statusParam === "cleared" ||
    statusParam === "deleted"
  ) {
    where.status = statusParam;
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      message: {
        select: {
          id: true,
          threadId: true,
          body: true,
          senderId: true,
          createdAt: true,
        },
      },
    },
  });

  return {
    tasks: tasks.map((t) => ({
      id: t.id,
      body: t.body,
      status: t.status,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      message: t.message,
    })),
  };
});

app.patch("/api/v1/tasks/:id", async (request, reply) => {
  const currentUser = await requireUser(app, request, reply);
  if (!currentUser) return;

  const { id: rawId } = request.params as { id: string };
  const id = requireUuid(rawId, reply);
  if (!id) return;

  const { status: rawStatus } = request.body as { status?: string };
  const status = parseTaskStatus(rawStatus);
  if (!status) {
    return reply.code(400).send({ error: "Status must be cleared or deleted" });
  }

  const task = await prisma.task.findUnique({
    where: { id },
  });

  if (!task) {
    return reply.code(404).send({ error: "Task not found" });
  }

  if (task.assigneeId !== currentUser.id) {
    return reply.code(403).send({ error: "Not allowed to update this task" });
  }

  const updated = await prisma.task.update({
    where: { id },
    data: { status },
  });

  return {
    task: {
      id: updated.id,
      body: updated.body,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    },
  };
});

app.get("/api/v1/threads", async (request, reply) => {
  const currentUser = await requireUser(app, request, reply);
  if (!currentUser) return;

  const threads = await prisma.thread.findMany({
    where: {
      OR: [{ userLowId: currentUser.id }, { userHighId: currentUser.id }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      userLow: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      userHigh: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, senderId: true, createdAt: true },
      },
    },
  });

  const list = threads.map((thread) => {
    const peer =
      thread.userLowId === currentUser.id ? thread.userHigh : thread.userLow;

    const lastMessage = thread.messages[0] ?? null;

    return {
      id: thread.id,
      createdAt: thread.createdAt,
      peer,
      lastMessage,
    };
  });

  return { threads: list };
});

app.post("/api/v1/auth/logout", async (_request, reply) => {
  reply.clearCookie("token", {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return { ok: true };
});

const start = async () => {
  try {
    await app.listen({ host, port });
    console.log(`PanChat API listening on http://${host}:${port}`);

    io = new Server(app.server, {
      cors: {
        origin: webOrigins(),
        credentials: true,
      },
    });

    io.use(async (socket, next) => {
      const cookieHeader = socket.handshake.headers.cookie ?? "";
      const token = cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("token="))
        ?.slice("token=".length);

      if (!token) {
        return next(new Error("Not authenticated"));
      }

      const dbUser = await authenticateSessionToken(app, token);
      if (!dbUser) {
        return next(new Error("Not authenticated"));
      }
      socket.data.userId = dbUser.id;
      next();
    });

    io.on("connection", (socket) => {
      const userId = socket.data.userId as string;
      socket.join(`user:${userId}`);

      const prev = onlineCounts.get(userId) ?? 0;
      onlineCounts.set(userId, prev + 1);
      if (prev === 0) {
        socket.broadcast.emit("user:online", { userId });
      }
      socket.emit("presence:sync", {
        onlineUserIds: [...onlineCounts.keys()],
      });

      socket.on("typing:start", async (payload: { threadId?: string }) => {
        const threadId = payload?.threadId;
        if (!threadId) return;

        const thread = await prisma.thread.findUnique({
          where: { id: threadId },
        });
        if (!thread) return;

        const isParticipant =
          thread.userLowId === userId || thread.userHighId === userId;
        if (!isParticipant) return;

        const peerId =
          thread.userLowId === userId ? thread.userHighId : thread.userLowId;

        io!.to(`user:${peerId}`).emit("typing:update", {
          threadId,
          userId,
          isTyping: true,
        });
      });

      socket.on("typing:stop", async (payload: { threadId?: string }) => {
        const threadId = payload?.threadId;
        if (!threadId) return;

        const thread = await prisma.thread.findUnique({
          where: { id: threadId },
        });
        if (!thread) return;

        const isParticipant =
          thread.userLowId === userId || thread.userHighId === userId;
        if (!isParticipant) return;

        const peerId =
          thread.userLowId === userId ? thread.userHighId : thread.userLowId;

        io!.to(`user:${peerId}`).emit("typing:update", {
          threadId,
          userId,
          isTyping: false,
        });
      });

      socket.on("disconnect", () => {
        const current = onlineCounts.get(userId) ?? 1;
        if (current <= 1) {
          onlineCounts.delete(userId);
          io!.emit("user:offline", { userId });
        } else {
          onlineCounts.set(userId, current - 1);
        }
      });

      console.log(`Socket connected: user ${userId}`);
    });

    app.log.info("Socket.io ready");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();