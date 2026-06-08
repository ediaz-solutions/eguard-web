import type { Device, Policy, AgentLog, DeviceOverride } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

class ApiClient {
  private token = '';

  setToken(t: string) { this.token = t; localStorage.setItem('eg_token', t); }
  getToken() { if (!this.token) this.token = localStorage.getItem('eg_token') || ''; return this.token; }
  clearToken() { this.token = ''; localStorage.removeItem('eg_token'); localStorage.removeItem('eg_company'); }
  isAuthenticated() { return !!this.getToken(); }
  setCompanyId(id: string) { localStorage.setItem('eg_company', id); }
  getCompanyId() { return localStorage.getItem('eg_company') || ''; }

  private async req<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((opts.headers as Record<string, string>) || {}),
    };
    if (this.getToken()) headers['X-Agent-Token'] = this.getToken();

    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });

    if (res.status === 401) { this.clearToken(); window.location.href = '/login'; throw new Error('Não autorizado'); }
    if (res.status === 204) return undefined as T;
    if (!res.ok) { const e = await res.json().catch(() => ({ error: `Erro ${res.status}` })); throw new Error(e.error); }
    return res.json();
  }

  // Devices
  getDevices = () => this.req<Device[]>(`/api/v1/devices?companyId=${this.getCompanyId()}`);
  createDevice = (hostname: string) => this.req<Device>('/api/v1/devices', {
    method: 'POST', body: JSON.stringify({ companyId: this.getCompanyId(), hostname }),
  });
  setDeviceActive = (id: string, active: boolean) =>
    this.req<Device>(`/api/v1/devices/${id}?active=${active}`, { method: 'PUT' });

  // Policies (profiles)
  getPolicies = () => this.req<Policy[]>(`/api/v1/policies?companyId=${this.getCompanyId()}`);
  createPolicy = (data: Record<string, unknown>) =>
    this.req<Policy>('/api/v1/policies', { method: 'POST', body: JSON.stringify({ ...data, companyId: this.getCompanyId() }) });
  updatePolicy = (id: string, data: Record<string, unknown>) =>
    this.req<Policy>(`/api/v1/policies/${id}`, { method: 'PUT', body: JSON.stringify({ ...data, companyId: this.getCompanyId() }) });
  deletePolicy = (id: string) => this.req<void>(`/api/v1/policies/${id}`, { method: 'DELETE' });

  // Logs
  getDeviceLogs = (deviceId: string, limit = 100) =>
    this.req<AgentLog[]>(`/api/v1/logs/${deviceId}?limit=${limit}`);

  // Hora Extra (overrides)
  getTodayOverrides = () =>
    this.req<DeviceOverride[]>('/api/v1/overrides/today');
  getDeviceOverrides = (deviceId: string) =>
    this.req<DeviceOverride[]>(`/api/v1/overrides/${deviceId}`);
  createOverride = (data: {
    deviceId: string;
    overrideDate: string;   // 'YYYY-MM-DD'
    extendedEnd: string;    // 'HH:mm:ss'
    reason?: string;
    createdBy?: string;
  }) => this.req<DeviceOverride>('/api/v1/overrides', { method: 'POST', body: JSON.stringify(data) });
  deleteOverride = (id: string) =>
    this.req<void>(`/api/v1/overrides/${id}`, { method: 'DELETE' });

  // Validate
  validateToken = async () => { try { await this.getDevices(); return true; } catch { return false; } };
}

export const api = new ApiClient();
