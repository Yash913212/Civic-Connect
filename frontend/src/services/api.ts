import { apiClient } from '@/auth/apiClient';

let API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
if (API_BASE.endsWith("/")) API_BASE = API_BASE.slice(0, -1);
if (!API_BASE.endsWith("/api")) API_BASE = `${API_BASE}/api`;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const response = await apiClient.request({
    url: path,
    method: method.toLowerCase() as any,
    data: body,
    headers,
  });

  return response.data as T;
}

export { API_BASE };
