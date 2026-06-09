import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { Device, Policy, AgentLog, DashboardStats, DeviceOverride, WindowsUser } from '../types';

function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fetcher()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro'); }
    finally { setLoading(false); }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload, setData };
}

export const useDevices      = () => useAsync<Device[]>(() => api.getDevices());
export const useWindowsUsers = () => useAsync<WindowsUser[]>(() => api.getWindowsUsers());
export const usePolicies     = () => useAsync<Policy[]>(() => api.getPolicies());
export const useDeviceLogs = (id: string | null) =>
  useAsync<AgentLog[]>(() => id ? api.getDeviceLogs(id) : Promise.resolve([]), [id]);
export const useDeviceOverrides = (id: string | null) =>
  useAsync<DeviceOverride[]>(() => id ? api.getDeviceOverrides(id) : Promise.resolve([]), [id]);

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Each call has its own .catch() so a single failure doesn't blank the whole dashboard
      const [devices, policies, todayOverrides] = await Promise.all([
        api.getDevices().catch(() => [] as Device[]),
        api.getPolicies().catch(() => [] as Policy[]),
        api.getTodayOverrides().catch(() => [] as DeviceOverride[]),
      ]);

      let recentLogs: AgentLog[] = [];
      const first = devices[0];
      if (first) try { recentLogs = await api.getDeviceLogs(first.id, 20); } catch {}

      setStats({
        totalDevices:    devices.length,
        onlineDevices:   devices.filter(d => d.isOnline).length,
        offlineDevices:  devices.filter(d => !d.isOnline && d.active).length,
        activePolicies:  policies.length,
        recentLogoffs:   recentLogs.filter(l => l.eventType === 'logoff_executed').length,
        recentLogs,
        devices,
        todayOverrides,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dashboard');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => {
    const i = setInterval(reload, 30_000);
    return () => clearInterval(i);
  }, [reload]);

  return { stats, loading, error, reload };
}
