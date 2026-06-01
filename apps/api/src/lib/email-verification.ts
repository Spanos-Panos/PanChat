import { prisma } from "./prisma.js";
import {
  createEmailVerificationToken,
  hashVerificationToken,
} from "./verify-token.js";
import { sendEmailVerificationEmail } from "./mail.js";
import { webOrigin } from "./auth-policy.js";

export async function issueEmailVerification(
  userId: string,
  email: string,
): Promise<{ verifyUrl: string }> {
  const { rawToken, tokenHash, expiresAt } = createEmailVerificationToken();

  await prisma.emailVerificationToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  const verifyUrl = `${webOrigin()}/?verify=${rawToken}`;
  await sendEmailVerificationEmail({ to: email, verifyUrl });

  return { verifyUrl };
}

export async function verifyEmailWithToken(
  rawToken: string,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const tokenHash = hashVerificationToken(rawToken.trim());
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (
    !record ||
    record.usedAt ||
    record.expiresAt < new Date() ||
    record.user.deletedAt
  ) {
    return { ok: false, error: "Invalid or expired verification link" };
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: now },
    }),
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    }),
  ]);

  return { ok: true, userId: record.userId };
}
