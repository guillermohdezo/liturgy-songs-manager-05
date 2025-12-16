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

    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
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
