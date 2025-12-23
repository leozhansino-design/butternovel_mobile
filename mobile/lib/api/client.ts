import * as SecureStore from 'expo-secure-store';

// TODO: 替换为你的实际 API 地址
const API_BASE = 'https://your-api-domain.com/api';

class ApiClient {
  private token: string | null = null;

  async init() {
    try {
      this.token = await SecureStore.getItemAsync('auth-token');
    } catch (error) {
      console.error('Error reading token:', error);
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.clearToken();
        throw new Error('AUTH_EXPIRED');
      }
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async setToken(token: string) {
    this.token = token;
    await SecureStore.setItemAsync('auth-token', token);
  }

  async clearToken() {
    this.token = null;
    await SecureStore.deleteItemAsync('auth-token');
  }

  getToken() {
    return this.token;
  }
}

export const api = new ApiClient();
