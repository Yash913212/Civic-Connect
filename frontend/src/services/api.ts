import { apiClient } from '@/auth/apiClient';

const API_BASE = '/api';

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
