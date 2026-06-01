import { userEmailIsVerified } from "./auth-policy.js";

export function serializeAuthUser(user: {
  id: string;
  email: string;
  username: string | null;
  displayName: string | null;
  birthDate: Date | null;
  avatarUrl: string | null;
  profileCompletedAt: Date | null;
  emailVerifiedAt: Date | null;
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    birthDate: user.birthDate,
    avatarUrl: user.avatarUrl,
    profileCompleted: user.profileCompletedAt != null,
    emailVerified: userEmailIsVerified(user),
  };
}
