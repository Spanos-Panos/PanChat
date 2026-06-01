/**
 * Input validation for PanChat API.
 * Prisma already prevents SQL injection; this layer limits abuse, crashes, and oversize payloads.
 */

export const LIMITS = {
  emailMax: 254,
  passwordMin: 8,
  passwordMax: 128,
  usernameMin: 3,
  usernameMax: 32,
  displayNameMax: 64,
  messageBodyMax: 4000,
  taskBodyMax: 500,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

/** PostgreSQL text is full UTF-8 — emojis are safe; we limit character count, not bytes. */
function charCount(text: string): number {
  return [...text].length;
}

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email || charCount(email) > LIMITS.emailMax) return null;
  if (!EMAIL_RE.test(email)) return null;
  return email;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (charCount(password) < LIMITS.passwordMin) {
    return `Password must be at least ${LIMITS.passwordMin} characters`;
  }
  if (charCount(password) > LIMITS.passwordMax) {
    return `Password must be at most ${LIMITS.passwordMax} characters`;
  }
  return null;
}

export function parseUsername(raw: string): { value: string } | { error: string } {
  const username = raw.trim();
  if (charCount(username) < LIMITS.usernameMin) {
    return {
      error: `Username must be at least ${LIMITS.usernameMin} characters`,
    };
  }
  if (charCount(username) > LIMITS.usernameMax) {
    return {
      error: `Username must be at most ${LIMITS.usernameMax} characters`,
    };
  }
  if (!USERNAME_RE.test(username)) {
    return {
      error: "Username can only use letters, numbers, and underscore",
    };
  }
  return { value: username };
}

export function parseDisplayName(raw: string | undefined): string | null {
  if (raw == null || raw.trim() === "") return null;
  const name = raw.trim();
  if (charCount(name) > LIMITS.displayNameMax) return null;
  return name;
}

export function parseMessageBody(raw: string): { value: string } | { error: string } {
  const body = raw.trim();
  if (!body) return { error: "Message body is required" };
  if (charCount(body) > LIMITS.messageBodyMax) {
    return {
      error: `Message must be at most ${LIMITS.messageBodyMax} characters`,
    };
  }
  return { value: body };
}

export function parseTaskBody(raw: string): { value: string } | { error: string } {
  const body = raw.trim();
  if (!body) return { error: "Task body is required" };
  if (charCount(body) > LIMITS.taskBodyMax) {
    return {
      error: `Task must be at most ${LIMITS.taskBodyMax} characters`,
    };
  }
  return { value: body };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseUuid(raw: string | undefined): string | null {
  const id = raw?.trim();
  if (!id || !UUID_RE.test(id)) return null;
  return id;
}

export function parseBirthDate(
  raw: string | undefined,
): { value: Date } | { error: string } | null {
  if (raw == null || raw.trim() === "") return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return { error: "Invalid birth date" };
  }
  const now = new Date();
  if (date > now) return { error: "Birth date cannot be in the future" };
  return { value: date };
}

export type TaskStatusUpdate = "cleared" | "deleted";

export function parseTaskStatus(
  raw: string | undefined,
): TaskStatusUpdate | null {
  if (raw === "cleared" || raw === "deleted") return raw;
  return null;
}
