/** Keep in sync with apps/api/src/lib/validate.ts LIMITS */
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
