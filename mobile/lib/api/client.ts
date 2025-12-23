import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS, APP_CONFIG } from '../config';

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

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearToken();
          throw new Error('AUTH_EXPIRED');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Network')) {
        throw new Error('NETWORK_ERROR');
      }
      throw error;
    }
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

// 导出类型
export interface Story {
  id: string;
  title: string;
  slug: string;
  blurb: string;
  readingPreview?: string | null;
  category: string;
  wordCount: number;
  readCount: number;
  likeCount: number;
  commentCount: number;
  averageRating: number | null;
  authorId: string;
  authorName: string;
  createdAt: string;
  content?: string;
}

export interface StoriesResponse {
  stories: Story[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// 便捷方法
export const shortsApi = {
  getList: (page = 1, limit = APP_CONFIG.DEFAULT_PAGE_SIZE, genre?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (genre) params.append('genre', genre);
    return api.get<StoriesResponse>(`${API_ENDPOINTS.SHORTS_LIST}?${params}`);
  },

  getDetail: (id: string) => {
    return api.get<Story>(API_ENDPOINTS.SHORTS_DETAIL(id));
  },

  like: (id: string) => {
    return api.post(`/api/shorts/${id}/recommend`, {});
  },
};
