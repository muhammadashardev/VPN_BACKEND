const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('vpn_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('vpn_token', token);
      } else {
        localStorage.removeItem('vpn_token');
      }
    }
  }

  getToken() {
    return this.token;
  }

  private async request(endpoint: string, method = 'GET', body?: any) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers['x-auth-token'] = this.token;

    const options: RequestInit = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE}${endpoint}`, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ msg: 'Request failed' }));
      throw new Error(error.msg || `HTTP ${response.status}`);
    }

    if (response.headers.get('content-type')?.includes('text/plain')) {
      return response.text();
    }
    return response.json();
  }

  // Auth
  async register(name: string, email: string, password: string) {
    const data = await this.request('/auth/register', 'POST', { name, email, password });
    this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request('/auth/login', 'POST', { email, password });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Servers
  async getServers() {
    return this.request('/servers');
  }

  // Connection
  async connect(serverId: string, type = 'proxy') {
    return this.request('/connection/connect', 'POST', { serverId, type });
  }

  async disconnect(type = 'proxy') {
    return this.request('/connection/disconnect', 'POST', { type });
  }

  async getConnectionStatus() {
    return this.request('/connection/status');
  }

  async getLastConnection() {
    return this.request('/connection/last');
  }

  async reconnect(type = 'proxy') {
    return this.request('/connection/reconnect', 'POST', { type });
  }

  async setAutoReconnect(enabled: boolean) {
    return this.request('/connection/auto-reconnect', 'PUT', { enabled });
  }

  // VPN Config (WireGuard)
  async createVpnClient(country: string, serverIP: string) {
    return this.request('/vpn/create', 'POST', { country, serverIP });
  }

  async getVpnConfig() {
    return this.request('/vpn/config');
  }

  async downloadVpnConfig() {
    return this.request('/vpn/download');
  }

  // Location
  async saveLocation(location: { country: string; countryCode: string; city: string; serverId: string }) {
    return this.request('/location/save', 'POST', location);
  }

  async getLastLocation() {
    return this.request('/location/last');
  }

  // Health
  async healthCheck() {
    return this.request('/health');
  }

  logout() {
    this.setToken(null);
  }
}

export const api = new ApiClient();
