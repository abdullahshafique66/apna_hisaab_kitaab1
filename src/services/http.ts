/**
 * Thin HTTP client for the future FastAPI backend.
 * Set VITE_API_URL (e.g. http://localhost:8000/api/v1) to switch the app from mock data to the real API.
 */
export const API_URL: string | undefined = import.meta.env.VITE_API_URL || undefined;

export class ApiError extends Error {
  constructor(public status: number, message: string, public detail?: unknown) {
    super(message);
  }
}

let authToken: string | null = null;
export const setAuthToken = (t: string | null) => {
  authToken = t;
};

type Query = Record<string, string | number | undefined | null>;

export async function http<T>(method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE", path: string, opts: { query?: Query; body?: unknown } = {}): Promise<T> {
  const url = new URL(API_URL + path, window.location.origin);
  if (opts.query) for (const [k, v] of Object.entries(opts.query)) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401 && !path.startsWith("/auth/")) {
    // Token expired or invalid → sign the user out everywhere
    window.dispatchEvent(new Event("ahk:unauthorized"));
  }
  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      /* no body */
    }
    const msg = (detail as { detail?: string })?.detail ?? res.statusText;
    throw new ApiError(res.status, typeof msg === "string" ? msg : "Request failed", detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Downloads a binary response (e.g. GET /reports/export) as a Blob. */
export async function httpBlob(path: string, query: Query = {}): Promise<Blob> {
  const url = new URL(API_URL + path, window.location.origin);
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} });
  if (!res.ok) throw new ApiError(res.status, res.statusText || "Download failed");
  return res.blob();
}
