import { createHash, randomBytes } from "node:crypto";

const VERIFY_TOKEN_BYTES = 32;
const VERIFY_EXPIRY_MS = 24 * 60 * 60 * 1000;

export function createEmailVerificationToken(): {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const rawToken = randomBytes(VERIFY_TOKEN_BYTES).toString("hex");
  const tokenHash = hashVerificationToken(rawToken);
  const expiresAt = new Date(Date.now() + VERIFY_EXPIRY_MS);
  return { rawToken, tokenHash, expiresAt };
}

export function hashVerificationToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
