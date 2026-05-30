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
const port = Number(process.env.API_PORT ?? 4000);

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
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

app.get("/health", async () => {
  return { ok: true };
});

app.get("/health/db", async () => {
  await prisma.$queryRaw`SELECT 1`;
  return { ok: true, database: "connected" };
});

app.post("/api/v1/auth/register", async (request, reply) => {
  const { email, password } = request.body as {
    email?: string;
    password?: string;
  };

  if (!email?.trim() || !password) {
    return reply.code(400).send({ error: "Email and password required" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (password.length < 8) {
    return reply
      .code(400)
      .send({ error: "Password must be at least 8 characters" });
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return reply.code(409).send({ error: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
    },
  });

  const token = app.jwt.sign({ sub: user.id });

  reply.setCookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return reply.code(201).send({
    user: {
      id: user.id,
      email: user.email,
      profileCompleted: user.profileCompletedAt != null,
    },
  });
});

app.post("/api/v1/auth/login", async (request, reply) => {
  const { email, password } = request.body as {
    email?: string;
    password?: string;
  };

  if (!email?.trim() || !password) {
    return reply.code(400).send({ error: "Email and password are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  const invalidCredentials = () =>
    reply.code(401).send({ error: "Invalid email or password" });

  if (!user) {
    return invalidCredentials();
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return invalidCredentials();
  }

  const token = app.jwt.sign({ sub: user.id });

  reply.setCookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return reply.send({
    user: {
      id: user.id,
      email: user.email,
      profileCompleted: user.profileCompletedAt != null,
    },
  });
});

app.get("/api/v1/auth/me", async (request, reply) => {
  const user = await requireUser(app, request, reply);
  if (!user) return;
  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      birthDate: user.birthDate,
      profileCompleted: user.profileCompletedAt != null,
      avatarUrl: user.avatarUrl,
    },
  };
});

app.patch("/api/v1/auth/me/profile", async (request, reply) => {
  const currentUser = await requireUser(app, request, reply);
  if (!currentUser) return;

  const body = request.body as {
    username?: string;
    displayName?: string;
    birthDate?: string;
  };

  const username = body.username?.trim();

  if (!username) {
    return reply.code(400).send({ error: "Username is required" });
  }

  if (username.length < 3) {
    return reply
      .code(400)
      .send({ error: "Username must be at least 3 characters" });
  }

  const taken = await prisma.user.findUnique({
    where: { username },
  });

  if (taken && taken.id !== currentUser.id) {
    return reply.code(409).send({ error: "Username already taken" });
  }

  const displayName = body.displayName?.trim() || username;

  let birthDate: Date | undefined;
  if (body.birthDate) {
    birthDate = new Date(body.birthDate);
    if (Number.isNaN(birthDate.getTime())) {
      return reply.code(400).send({ error: "Invalid birth date" });
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

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      birthDate: user.birthDate,
      profileCompleted: user.profileCompletedAt != null,
    },
  };
});

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

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      birthDate: user.birthDate,
      avatarUrl: user.avatarUrl,
      profileCompleted: user.profileCompletedAt != null,
    },
  };
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

  const { peerUserId } = request.body as { peerUserId?: string };

  if (!peerUserId) {
    return reply.code(400).send({ error: "peerUserId is required" });
  }

  if (peerUserId === currentUser.id) {
    return reply
      .code(400)
      .send({ error: "Cannot create a thread with yourself" });
  }

  const peer = await prisma.user.findUnique({
    where: { id: peerUserId },
  });

  if (!peer || peer.deletedAt || !peer.username) {
    return reply.code(401).send({ error: "User not found" });
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

  const { id: threadId } = request.params as { id: string };
  const { body, task } = request.body as {
    body?: string;
    task?: { body?: string };
  };

  const text = body?.trim();
  const taskText = task?.body?.trim();

  if (task && !taskText) {
    return reply
      .code(400)
      .send({ error: "Task body is required when task is attached" });
  }
  if (!text) {
    return reply.code(400).send({ error: "Message body is required" });
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

  const { id: threadId } = request.params as { id: string };

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

  const { id } = request.params as { id: string };
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

  const { id } = request.params as { id: string };
  const { status } = request.body as { status?: string };

  if (status !== "cleared" && status !== "deleted") {
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
        origin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
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

      try {
        const payload = await app.jwt.verify<{ sub: string }>(token);
        const dbUser = await prisma.user.findUnique({
          where: { id: payload.sub },
        });
        if (!dbUser || dbUser.deletedAt) {
          return next(new Error("Not authenticated"));
        }
        socket.data.userId = dbUser.id;
        next();
      } catch {
        next(new Error("Not authenticated"));
      }
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