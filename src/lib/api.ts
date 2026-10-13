const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

/** Erreur HTTP de l'API : garde le code pour que l'appelant puisse distinguer 401 / 404 / 5xx. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiOptions {
  accessToken?: string;
  cache?: RequestCache;
  /** En-têtes supplémentaires (ex. les infos du visiteur transmises à POST /plays). */
  headers?: Record<string, string>;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: ApiOptions = {}
): Promise<T> {
  const headers: Record<string, string> = { ...opts.headers };
  // Secret partagé avec l'API (serveur uniquement : la variable n'a pas de préfixe NEXT_PUBLIC_, donc elle n'existe
  // pas dans le navigateur). Il prouve que la requête vient de notre app, pour que l'API croie le pays, l'appareil
  // et l'IP qu'on lui transmet (API/src/lib/webappAuth.ts).
  const webappSecret = typeof window === "undefined" ? process.env.WEBAPP_SHARED_SECRET : undefined;
  if (webappSecret) headers["x-vynl-webapp-secret"] = webappSecret;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.accessToken) headers["Authorization"] = `Bearer ${opts.accessToken}`;

  const res = await fetch(API_BASE_URL + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: opts.cache ?? "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(errorBody.error || `Request failed: ${res.status}`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string, opts?: ApiOptions) => request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: ApiOptions) => request<T>("POST", path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: ApiOptions) => request<T>("PATCH", path, body, opts),
  delete: <T>(path: string, opts?: ApiOptions) => request<T>("DELETE", path, undefined, opts),
};
