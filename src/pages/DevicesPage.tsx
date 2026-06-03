import { useState } from 'react';
import { Monitor, Plus, Power, PowerOff, Copy, Check, AlertCircle, Link } from 'lucide-react';
import { useDevices, usePolicies } from '../hooks/useData';
import { api } from '../services/api';
import { timeAgo, formatTime } from '../utils';
import { DAY_LABELS, ALL_DAYS, type Policy } from '../types';

export default function DevicesPage() {
  const { data: devices, loading, reload } = useDevices();
  const { data: policies } = usePolicies();
  const [showForm, setShowForm] = useState(false);
  const [hostname, setHostname] = useState('');
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!hostname.trim()) return;
    setCreating(true); setError('');
    try {
      const d = await api.createDevice(hostname.trim().toUpperCase());
      if (d.agentToken) setNewToken(d.agentToken);
      setHostname(''); reload();
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro'); }
    setCreating(false);
  }

  async function toggle(id: string, active: boolean) {
    try { await api.setDeviceActive(id, !active); reload(); } catch {}
  }

  function copyToken() {
    navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Find which policy is assigned to a device
  function getDevicePolicy(deviceId: string): Policy | undefined {
    return policies?.find(p => p.targetType === 'device' && p.targetId === deviceId);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Dispositivos</h1>
          <p className="text-surface-400 text-sm mt-1">Gerencie equipamentos e vincule perfis de horário</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setNewToken(''); setError(''); }}
          className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />Novo dispositivo
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card p-6 animate-slide-up space-y-4">
          <h2 className="font-semibold text-surface-100">Cadastrar dispositivo</h2>
          <div className="flex gap-3">
            <input type="text" className="input-field flex-1 font-mono uppercase"
              placeholder="Nome do computador (hostname)"
              value={hostname} onChange={e => setHostname(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()} />
            <button onClick={handleCreate} disabled={creating || !hostname.trim()} className="btn-primary">
              {creating ? 'Criando...' : 'Cadastrar'}
            </button>
          </div>
          <p className="text-xs text-surface-500">
            Rode <code className="text-brand-400">$env:COMPUTERNAME</code> no PowerShell para descobrir o hostname
          </p>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-3 border border-red-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {newToken && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                <AlertCircle className="w-4 h-4" />Token gerado — copie agora, não será exibido novamente
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-surface-800 rounded px-3 py-2 text-sm font-mono text-surface-200 select-all">{newToken}</code>
                <button onClick={copyToken} className="btn-secondary p-2.5">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-brand-600/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card divide-y divide-surface-800/50">
          {!devices?.length ? (
            <div className="p-12 text-center text-surface-500">
              <Monitor className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nenhum dispositivo cadastrado</p>
            </div>
          ) : devices.map(d => {
            const policy = getDevicePolicy(d.id);
            return (
              <div key={d.id} className="px-6 py-4 hover:bg-surface-800/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      d.isOnline ? 'bg-emerald-500/10' : 'bg-surface-800'
                    }`}>
                      <Monitor className={`w-5 h-5 ${d.isOnline ? 'text-emerald-400' : 'text-surface-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-surface-100 font-mono">{d.hostname}</span>
                        {d.isOnline
                          ? <span className="badge-online"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />Online</span>
                          : <span className="badge-offline">Offline</span>}
                      </div>
                      <div className="flex items-center gap-4 mt-1.5">
                        <span className="text-xs text-surface-500">Visto {timeAgo(d.lastSeenAt)}</span>

                        {policy ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-navy-400 bg-navy-600/10 px-2 py-0.5 rounded border border-navy-600/15">
                            <Link className="w-3 h-3" />
                            {policy.name || 'Perfil'}: {formatTime(policy.timeStart)}–{formatTime(policy.timeEnd)}
                            <span className="text-navy-500 ml-1">
                              {policy.allowedDays.map(d => DAY_LABELS[d]).join(', ')}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-amber-500/70 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                            Sem perfil vinculado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button onClick={() => toggle(d.id, d.active)}
                    className={`p-2 rounded-lg transition-colors ${
                      d.active
                        ? 'text-surface-400 hover:text-red-400 hover:bg-red-500/10'
                        : 'text-surface-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                    }`} title={d.active ? 'Desativar' : 'Ativar'}>
                    {d.active ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
