/** When true, email/password users must verify inbox before login. */
export function isEmailVerificationRequired(): boolean {
  const raw = process.env.AUTH_REQUIRE_EMAIL_VERIFICATION?.trim().toLowerCase();
  if (raw === "true") return true;
  if (raw === "false") return false;
  return process.env.NODE_ENV === "production";
}

export function isGoogleAuthEnabled(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

export function apiPublicOrigin(): string {
  const base = (
    process.env.API_PUBLIC_URL ??
    `http://localhost:${process.env.API_PORT ?? 4000}`
  ).replace(/\/$/, "");
  return base;
}

export function webOrigin(): string {
  return (process.env.WEB_ORIGIN ?? "http://localhost:5173").replace(/\/$/, "");
}

export function userEmailIsVerified(user: {
  emailVerifiedAt: Date | null;
}): boolean {
  return user.emailVerifiedAt != null;
}

export function canUsePasswordLogin(user: {
  passwordHash: string | null;
  deletedAt: Date | null;
}): boolean {
  return Boolean(user.passwordHash) && !user.deletedAt;
}
