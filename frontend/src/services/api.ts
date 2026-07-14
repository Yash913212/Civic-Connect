const API_BASE = (process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || "http://localhost:8000").replace(/\/+$/, '');

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('access_token') || sessionStorage.getItem('access_token'))
    : null;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const doFetch = (): Promise<Response> =>
    fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch();

  if (res.status === 401 && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (refreshRes.ok) {
          const { access_token } = await refreshRes.json();
          localStorage.setItem('access_token', access_token);
          res = await doFetch();
        }
      } catch {
        // refresh failed; proceed with original error
      }
    }
  }

  if (!res.ok) {
    const detail = await res.json().then(d => d.detail).catch(() => res.statusText);
    throw new Error(detail || `Request failed: ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : undefined as T;
}

export { API_BASE, getAuthHeaders };
