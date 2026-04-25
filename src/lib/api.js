// Tiny fetch wrapper. credentials:'include' sends the crm_session cookie;
// JSON encode/decode; uniform error envelope from the API.
//
// In dev the API runs on a different port (4000) so we point at it
// explicitly. In prod we expect the frontend and API to share an origin
// (Render reverse proxy or single domain), so paths are relative.

const BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:4000' : '');

export class ApiError extends Error {
  constructor(status, code, details) {
    super(code || `http_${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function api(path, opts = {}) {
  const { method = 'GET', body, headers, ...rest } = opts;
  const finalHeaders = { ...headers };
  if (body !== undefined) finalHeaders['content-type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (res.status === 204) return null;

  // Best-effort JSON parse; non-JSON responses still throw with status.
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.error, data?.details);
  }
  return data;
}
