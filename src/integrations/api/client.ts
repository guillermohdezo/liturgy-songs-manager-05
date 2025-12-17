// API client for communicating with backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string;
}

export class ApiClient {
  private static async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { method = 'GET', body, token } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = `${API_URL}${endpoint}`;
    console.log(`[API] ${method} ${fullUrl}`, { hasToken: !!token });

    try {
      console.log('[API] Starting fetch...');
      
      // Add a timeout of 10 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('[API] TIMEOUT - Request took too long!');
        controller.abort();
      }, 10000);

      const response = await fetch(fullUrl, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`[API] Response received - status: ${response.status}`);

      if (!response.ok) {
        console.log('[API] Response not ok, trying to parse error');
        const error = await response.json();
        console.log('[API] Error:', error);
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      console.log('[API] Parsing response JSON...');
      const data = await response.json();
      console.log('[API] Response parsed successfully, data length:', JSON.stringify(data).length);
      return data as Promise<T>;
    } catch (error) {
      console.error('[API] Fetch error:', error);
      if (error instanceof TypeError) {
        console.error('[API] Network error - Request failed to complete');
      }
      throw error;
    }
  }

  // Auth endpoints
  static async signup(email: string, password: string, nombre: string, token?: string) {
    return this.request<any>('/api/auth/signup', {
      method: 'POST',
      body: { email, password, nombre },
      token,
    });
  }

  static async login(email: string, password: string) {
    console.log('[API] Attempting login with:', email);
    return this.request<any>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  static async logout(token: string) {
    return this.request<any>('/api/auth/logout', {
      method: 'POST',
      token,
    });
  }

  // Misas endpoints
  static async getMisas(token: string) {
    console.log('[API] Fetching misas with token:', token?.substring(0, 10) + '...');
    return this.request<any[]>('/api/misas', { token });
  }

  static async getMisa(id: string, token: string) {
    return this.request<any>(`/api/misas/${id}`, { token });
  }

  static async createMisa(data: { fecha: string; descripcion?: string | null }, token: string) {
    return this.request<any>('/api/misas', {
      method: 'POST',
      body: data,
      token,
    });
  }

  static async updateMisa(id: string, data: { fecha: string; descripcion?: string | null }, token: string) {
    return this.request<any>(`/api/misas/${id}`, {
      method: 'PUT',
      body: data,
      token,
    });
  }

  static async deleteMisa(id: string, token: string) {
    return this.request<any>(`/api/misas/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  // Cantos endpoints
  static async getCantos(token: string) {
    return this.request<any[]>('/api/cantos', { token });
  }

  static async createCanto(data: {
    nombre: string;
    tipo: string;
    tiempos_liturgicos: string[];
    foto_url?: string | null;
    audio_url?: string | null;
  }, token: string) {
    return this.request<any>('/api/cantos', {
      method: 'POST',
      body: data,
      token,
    });
  }

  static async updateCanto(id: string, data: {
    nombre: string;
    tipo: string;
    tiempos_liturgicos: string[];
    foto_url?: string | null;
    audio_url?: string | null;
  }, token: string) {
    return this.request<any>(`/api/cantos/${id}`, {
      method: 'PUT',
      body: data,
      token,
    });
  }

  static async deleteCanto(id: string, token: string) {
    return this.request<any>(`/api/cantos/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  // Misa Cantos endpoints
  static async addCantoToMisa(misaId: string, cantoId: string, tipo: string, orden: number, token: string) {
    return this.request<any>(`/api/misas/${misaId}/cantos`, {
      method: 'POST',
      body: { cantoId, tipo, orden },
      token,
    });
  }

  static async removeCantoFromMisa(misaCantoId: string, token: string) {
    return this.request<any>(`/api/misa-cantos/${misaCantoId}`, {
      method: 'DELETE',
      token,
    });
  }

  // Lecturas endpoints
  static async getLecturas(fecha: string) {
    return this.request<any>(`/api/lecturas/${fecha}`);
  }
}
