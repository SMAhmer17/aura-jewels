import { useAdminAuthStore } from "@/store/admin-auth-store";
import { useCustomerAuthStore } from "@/store/customer-auth-store";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

/** An error from the API, with the message the server sent (already written for customers). */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Audience = "public" | "admin" | "customer";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Which signed-in session's token to send. Public calls send none. */
  as?: Audience;
  query?: Record<string, string | number | boolean | undefined | null>;
}

function tokenFor(as: Audience): string | null {
  if (as === "admin") return useAdminAuthStore.getState().token;
  if (as === "customer") return useCustomerAuthStore.getState().token;
  return null;
}

/** Nest sends `message` as a string, or an array of validation messages. */
function messageFrom(payload: unknown, fallback: string): string {
  const message = (payload as { message?: unknown } | null)?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string" && message) return message;
  return fallback;
}

async function send(path: string, init: RequestInit, as: Audience): Promise<Response> {
  const token = tokenFor(as);
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  try {
    return await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0);
  }
}

async function parse<T>(res: Response, as: Audience): Promise<T> {
  if (res.status === 204) return undefined as T;
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    // An expired or revoked session: sign out so the dashboard sends the admin back to login.
    if (res.status === 401 && as === "admin" && tokenFor("admin")) useAdminAuthStore.getState().logout();
    if (res.status === 401 && as === "customer" && tokenFor("customer")) useCustomerAuthStore.getState().logout();
    throw new ApiError(messageFrom(payload, "Something went wrong. Please try again."), res.status);
  }
  return payload as T;
}

export async function api<T>(path: string, { method = "GET", body, as = "public", query }: RequestOptions = {}): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const suffix = params.size > 0 ? `?${params}` : "";
  const res = await send(
    `${path}${suffix}`,
    {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    },
    as,
  );
  return parse<T>(res, as);
}

/** Sends a file as multipart form data (admin uploads). */
export async function uploadFile<T>(path: string, file: Blob, filename: string, as: Audience = "admin"): Promise<T> {
  const form = new FormData();
  form.append("file", file, filename);
  const res = await send(path, { method: "POST", body: form }, as);
  return parse<T>(res, as);
}

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  return error instanceof ApiError ? error.message : fallback;
}
