const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiOptions = {
  method?: string;
  body?: unknown;
};

type AuthUser = {
  id: string;
  email: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  profileCompleted: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { method = "GET", body } = options;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof data === "object" && data && "error" in data
        ? String((data as { error: string }).error)
        : res.statusText;
    throw new Error(message);
  }

  return data as T;
}

export function avatarSrc(
  path: string | null | undefined,
  version?: number,
): string | null {
  if (!path) return null;
  const url = `${API_BASE}${path}`;
  return version ? `${url}?v=${version}` : url;
}

export async function apiUploadAvatar(file: File): Promise<{ user: AuthUser }> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/api/v1/auth/me/avatar`, {
    method: "POST",
    body: form,
    credentials: "include",
    // Do NOT set Content-Type — browser adds multipart boundary
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof data === "object" && data && "error" in data
        ? String((data as { error: string }).error)
        : res.statusText;
    throw new Error(message);
  }

  return data as { user: AuthUser };
}
