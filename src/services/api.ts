import { supabase } from '../lib/supabase';
import type {
  Device, Policy, PolicyAssignment, AgentLog, DeviceOverride, WindowsUser, CompanyToken,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

class ApiClient {
  // Gets the current Supabase session JWT
  private async getJwt(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  isAuthenticated(): boolean {
    // Sync check — session is cached by Supabase client
    return !!localStorage.getItem('sb-' + new URL(import.meta.env.VITE_SUPABASE_URL || 'http://localhost').hostname.split('.')[0] + '-auth-token');
  }

  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    return supabase.auth.signOut();
  }

  private async req<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const jwt = await this.getJwt();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((opts.headers as Record<string, string>) || {}),
    };

    if (jwt) headers['Authorization'] = `Bearer ${jwt}`;

    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });

    if (res.status === 401) {
      await supabase.auth.signOut();
      window.location.href = '/login';
      throw new Error('Não autorizado');
    }
    if (res.status === 204) return undefined as T;
    if (!res.ok) {
      const e = await res.json().catch(() => ({ error: `Erro ${res.status}` }));
      throw new Error(e.error);
    }
    return res.json();
  }

  // ── Devices ──────────────────────────────────────────────────────────────────
  getDevices = () => this.req<Device[]>('/api/v1/devices');
  createDevice = (hostname: string) =>
    this.req<Device>('/api/v1/devices', { method: 'POST', body: JSON.stringify({ hostname }) });
  setDeviceActive = (id: string, active: boolean) =>
    this.req<Device>(`/api/v1/devices/${id}?active=${active}`, { method: 'PUT' });

  // ── Windows Users ─────────────────────────────────────────────────────────────
  getWindowsUsers = () => this.req<WindowsUser[]>('/api/v1/users');
  setUserActive = (id: string, active: boolean) =>
    this.req<WindowsUser>(`/api/v1/users/${id}?active=${active}`, { method: 'PUT' });

  // ── Policies ─────────────────────────────────────────────────────────────────
  getPolicies = () => this.req<Policy[]>('/api/v1/policies');
  createPolicy = (data: { name?: string; allowedDays: string[]; timeStart: string; timeEnd: string; warnMinutes: number; action?: string }) =>
    this.req<Policy>('/api/v1/policies', { method: 'POST', body: JSON.stringify(data) });
  updatePolicy = (id: string, data: { name?: string; allowedDays: string[]; timeStart: string; timeEnd: string; warnMinutes: number; action?: string }) =>
    this.req<Policy>(`/api/v1/policies/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  deletePolicy = (id: string) => this.req<void>(`/api/v1/policies/${id}`, { method: 'DELETE' });

  // ── Assignments ──────────────────────────────────────────────────────────────
  createAssignment = (policyId: string, targetType: 'device' | 'user', targetId: string) =>
    this.req<PolicyAssignment>('/api/v1/assignments', {
      method: 'POST',
      body: JSON.stringify({ policyId, targetType, targetId }),
    });
  deleteAssignment = (id: string) =>
    this.req<void>(`/api/v1/assignments/${id}`, { method: 'DELETE' });

  // ── Logs ─────────────────────────────────────────────────────────────────────
  getDeviceLogs = (deviceId: string, limit = 100) =>
    this.req<AgentLog[]>(`/api/v1/logs/${deviceId}?limit=${limit}`);

  // ── Hora Extra (overrides) ────────────────────────────────────────────────────
  getTodayOverrides = () => this.req<DeviceOverride[]>('/api/v1/overrides/today');
  getDeviceOverrides = (deviceId: string) =>
    this.req<DeviceOverride[]>(`/api/v1/overrides/${deviceId}`);
  createOverride = (data: {
    deviceId?: string;
    windowsUserId?: string;
    overrideType: 'device' | 'user';
    overrideDate: string;
    extendedEnd: string;
    reason?: string;
    createdBy?: string;
  }) => this.req<DeviceOverride>('/api/v1/overrides', { method: 'POST', body: JSON.stringify(data) });
  deleteOverride = (id: string) => this.req<void>(`/api/v1/overrides/${id}`, { method: 'DELETE' });

  // ── Company Tokens ─────────────────────────────────────────────────────────
  getCompanyTokens = () => this.req<CompanyToken[]>('/api/v1/tokens');
  createCompanyToken = (data: { name?: string; maxDevices?: number; expiresAt?: string }) =>
    this.req<CompanyToken>('/api/v1/tokens', { method: 'POST', body: JSON.stringify(data) });
  revokeCompanyToken = (id: string) =>
    this.req<void>(`/api/v1/tokens/${id}`, { method: 'DELETE' });
}

export const api = new ApiClient();
