import axios from 'axios';

let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
if (API_URL.endsWith('/')) API_URL = API_URL.slice(0, -1);
if (!API_URL.endsWith('/api')) API_URL = `${API_URL}/api`;

interface ErrorResponse {
  detail?: string | string[];
  message?: string;
}

const handleApiError = (error: any): string => {
  if (error.response?.data) {
    const data = error.response.data as ErrorResponse;
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail)) return data.detail.join(', ');
    if (data.message) return data.message;
  }
  if (error.message) return error.message;
  return 'An unexpected error occurred';
};

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (response.data?.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(new Error(handleApiError(error)));
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true
        });
        const { access_token } = response.data;
        
        localStorage.setItem('access_token', access_token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
    }
    return Promise.reject(new Error(handleApiError(error)));
  }
);

export const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

authApi.interceptors.response.use(
  (response) => {
    if (response.data?.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response;
  },
  (error) => {
    return Promise.reject(new Error(handleApiError(error)));
  }
);
