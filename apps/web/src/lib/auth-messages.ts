import { ApiError } from "./api";

/** Map API/auth errors to short, human-friendly copy (no status codes or stack traces). */
export function friendlyAuthError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case "EMAIL_NOT_VERIFIED":
        return "Please verify your email before signing in. Use the link we sent you, or resend it below.";
      case "EMAIL_SEND_FAILED":
        return "We couldn't send that email right now. Wait a minute and try again, and check your spam folder.";
      case "EMAIL_IN_USE":
        return "An account with this email already exists. Try signing in, or use Forgot password.";
      case "INVALID_CREDENTIALS":
        return "That email or password doesn't look right. Check both and try again, or reset your password.";
      case "INVALID_TOKEN":
        return "This link has expired or was already used. Request a new one and try again.";
      case "RATE_LIMITED":
        return "Too many attempts. Please wait a few minutes and try again.";
      case "USE_GOOGLE_SIGN_IN":
        return "This account was created with Google. Use Continue with Google to sign in.";
    }

    const msg = err.message.trim();
    if (/invalid email or password/i.test(msg)) {
      return "That email or password doesn't look right. Check both and try again, or reset your password.";
    }
    if (/email already in use/i.test(msg)) {
      return "An account with this email already exists. Try signing in instead.";
    }
    if (/could not send verification/i.test(msg)) {
      return "We couldn't send the verification email. Try again in a minute, or use a different email address.";
    }
    if (/could not send reset/i.test(msg)) {
      return "We couldn't send the reset email right now. Try again in a minute and check your spam folder.";
    }
    if (/invalid or expired verification/i.test(msg)) {
      return "This verification link is invalid or has expired. Request a new one from the sign-in screen.";
    }
    if (/invalid or expired/i.test(msg) && /reset|link/i.test(msg)) {
      return "This reset link is invalid or has expired. Request a new password reset email.";
    }
    if (/passwords do not match/i.test(msg)) {
      return "Those passwords don't match. Type the same password in both fields.";
    }
    if (msg.length > 0 && msg.length < 200 && !/failed to send email \(\d+\)/i.test(msg)) {
      return msg;
    }
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "You appear to be offline. Check your connection and try again.";
  }

  return "Something went wrong. Please try again.";
}
