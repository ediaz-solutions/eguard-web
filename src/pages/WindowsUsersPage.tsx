import { useState, useEffect } from 'react';
import { Users, Power, PowerOff, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { usePolicies } from '../hooks/useData';
import { api } from '../services/api';
import { timeAgo } from '../utils';
import type { WindowsUser } from '../types';

// ── Policy selector ───────────────────────────────────────────────────────────

interface PolicySelectorProps {
  userId: string;
  currentPolicyId: string | undefined;
  onChanged: () => void;
}

function PolicySelector({ userId, currentPolicyId, onChanged }: PolicySelectorProps) {
  const { data: policies } = usePolicies();
  const [busy, setBusy] = useState(false);

  async function handleChange(newPolicyId: string) {
    setBusy(true);
    try {
      if (newPolicyId === '') {
        const existing = policies
          ?.flatMap(p => p.assignments)
          .find(a => a.targetType === 'user' && a.targetId === userId);
        if (existing) await api.deleteAssignment(existing.id);
      } else {
        await api.createAssignment(newPolicyId, 'user', userId);
      }
      onChanged();
    } catch { /* silent */ } finally { setBusy(false); }
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={currentPolicyId ?? ''}
        disabled={busy}
        onChange={e => handleChange(e.target.value)}
        className={`appearance-none pl-2.5 pr-7 py-1 rounded-lg text-xs border transition-all cursor-pointer
          disabled:opacity-50 disabled:cursor-wait
          ${currentPolicyId
            ? 'bg-brand-600/10 text-brand-300 border-brand-600/25 hover:bg-brand-600/15'
            : 'bg-surface-800 text-surface-400 border-surface-700 hover:bg-surface-700'
          }`}
      >
        <option value="">Sem perfil</option>
        {(policies ?? []).map(p => (
          <option key={p.id} value={p.id}>{p.name || 'Sem nome'}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-1.5 w-3 h-3 pointer-events-none text-surface-500" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WindowsUsersPage() {
  const [users, setUsers]   = useState<WindowsUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const { data: policies, reload: reloadPolicies } = usePolicies();

  function getUserPolicyId(userId: string): string | undefined {
    return policies
      ?.find(p => p.assignments.some(a => a.targetType === 'user' && a.targetId === userId))
      ?.id;
  }

  async function load() {
    setLoading(true); setError('');
    try { setUsers(await api.getWindowsUsers()); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro ao carregar usuários'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(user: WindowsUser) {
    try {
      const updated = await api.setUserActive(user.id, !user.active);
      setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro'); }
  }

  const active   = users.filter(u => u.active);
  const inactive = users.filter(u => !u.active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-3">
            <Users className="w-7 h-7 text-brand-400" />
            Usuários Windows
          </h1>
          <p className="text-surface-500 text-sm mt-1">
            Usuários detectados automaticamente via heartbeat do agente
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 hover:bg-surface-700
                     text-surface-300 text-sm transition-all disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-surface-50">{users.length}</div>
          <div className="text-surface-500 text-xs mt-1">Total</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{active.length}</div>
          <div className="text-surface-500 text-xs mt-1">Ativos</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-surface-500">{inactive.length}</div>
          <div className="text-surface-500 text-xs mt-1">Inativos</div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-3 border border-red-500/20">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-surface-700 mx-auto mb-4" />
          <p className="text-surface-500">Nenhum usuário detectado ainda.</p>
          <p className="text-surface-600 text-sm mt-1">
            Os usuários aparecem automaticamente quando o agente envia heartbeats.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-800">
                <th className="text-left px-5 py-3 text-surface-500 font-medium">Usuário</th>
                <th className="text-left px-5 py-3 text-surface-500 font-medium">Perfil de horário</th>
                <th className="text-left px-5 py-3 text-surface-500 font-medium">Último dispositivo</th>
                <th className="text-left px-5 py-3 text-surface-500 font-medium">Último acesso</th>
                <th className="text-left px-5 py-3 text-surface-500 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/60">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-surface-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-surface-200 font-mono">{u.username}</div>
                    {u.displayName && (
                      <div className="text-surface-500 text-xs">{u.displayName}</div>
                    )}
                  </td>

                  {/* ── Policy selector ── */}
                  <td className="px-5 py-3.5">
                    <PolicySelector
                      userId={u.id}
                      currentPolicyId={getUserPolicyId(u.id)}
                      onChanged={reloadPolicies}
                    />
                  </td>

                  <td className="px-5 py-3.5 text-surface-400 font-mono text-xs">
                    {u.lastDeviceHostname ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-surface-400 text-xs">
                    {u.lastSeenAt ? timeAgo(u.lastSeenAt) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      u.active
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-surface-800 text-surface-500 border border-surface-700'
                    }`}>
                      {u.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => toggleActive(u)}
                      title={u.active ? 'Desativar' : 'Ativar'}
                      className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-500 hover:text-surface-300 transition-all">
                      {u.active
                        ? <PowerOff className="w-4 h-4 text-red-400" />
                        : <Power   className="w-4 h-4 text-green-400" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
