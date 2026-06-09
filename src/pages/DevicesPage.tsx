import { useState } from 'react';
import { Monitor, Plus, Power, PowerOff, Copy, Check, AlertCircle, Link, Clock, Trash2, X } from 'lucide-react';
import { useDevices, usePolicies } from '../hooks/useData';
import { api } from '../services/api';
import { timeAgo, formatTime } from '../utils';
import { DAY_LABELS, ALL_DAYS, type Policy, type DeviceOverride } from '../types';

// ── Hora Extra modal ──────────────────────────────────────────────────────────

interface OverrideModalProps {
  deviceId: string;
  deviceHostname: string;
  existing: DeviceOverride | null;
  onClose: () => void;
  onSaved: () => void;
}

function OverrideModal({ deviceId, deviceHostname, existing, onClose, onSaved }: OverrideModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate]     = useState(existing?.overrideDate ?? today);
  const [time, setTime]     = useState(existing?.extendedEnd?.slice(0, 5) ?? '');
  const [reason, setReason] = useState(existing?.reason ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function handleSave() {
    if (!time) { setError('Informe o horário de fim.'); return; }
    setSaving(true); setError('');
    try {
      await api.createOverride({
        deviceId,
        overrideType: 'device',
        overrideDate: date,
        extendedEnd:  time + ':00',
        reason:       reason || undefined,
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existing) return;
    setSaving(true);
    try { await api.deleteOverride(existing.id); onSaved(); onClose(); }
    catch { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-900 border border-surface-700 rounded-xl shadow-2xl w-full max-w-md mx-4 animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800">
          <div>
            <h3 className="font-semibold text-surface-100">Hora Extra</h3>
            <p className="text-xs text-surface-400 font-mono mt-0.5">{deviceHostname}</p>
          </div>
          <button onClick={onClose} className="text-surface-500 hover:text-surface-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs text-surface-400 mb-1.5">Data</label>
            <input type="date" value={date} min={today}
              onChange={e => setDate(e.target.value)}
              className="input-field w-full" />
          </div>

          <div>
            <label className="block text-xs text-surface-400 mb-1.5">Novo horário de fim</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="input-field w-full font-mono text-lg" />
            <p className="text-xs text-surface-500 mt-1">
              O agente usará este horário como fim do turno nessa data.
            </p>
          </div>

          <div>
            <label className="block text-xs text-surface-400 mb-1.5">Motivo (opcional)</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Ex: Reunião até mais tarde"
              className="input-field w-full" />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-3 border border-red-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-surface-800 flex items-center gap-3">
          {existing && (
            <button onClick={handleDelete} disabled={saving}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors mr-auto">
              <Trash2 className="w-4 h-4" />Remover hora extra
            </button>
          )}
          <button onClick={onClose} disabled={saving} className="btn-secondary text-sm ml-auto">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || !time} className="btn-primary text-sm">
            {saving ? 'Salvando...' : existing ? 'Atualizar' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DevicesPage() {
  const { data: devices, loading, reload } = useDevices();
  const { data: policies } = usePolicies();
  const [showForm, setShowForm] = useState(false);
  const [hostname, setHostname] = useState('');
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Hora Extra state
  const [overrideModal, setOverrideModal] = useState<{
    deviceId: string;
    deviceHostname: string;
    existing: DeviceOverride | null;
  } | null>(null);
  const [deviceOverrides, setDeviceOverrides] = useState<Record<string, DeviceOverride>>({});

  // Load today's overrides for all devices on mount
  useState(() => {
    api.getTodayOverrides().then(list => {
      const map: Record<string, DeviceOverride> = {};
      list.forEach(ov => { if (ov.deviceId) map[ov.deviceId] = ov; });
      setDeviceOverrides(map);
    }).catch(() => {});
  });

  function reloadOverrides() {
    api.getTodayOverrides().then(list => {
      const map: Record<string, DeviceOverride> = {};
      list.forEach(ov => { if (ov.deviceId) map[ov.deviceId] = ov; });
      setDeviceOverrides(map);
    }).catch(() => {});
  }

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

  function getDevicePolicy(deviceId: string): Policy | undefined {
    return policies?.find(p =>
      p.assignments.some(a => a.targetType === 'device' && a.targetId === deviceId),
    );
  }

  return (
    <div className="space-y-6">
      {overrideModal && (
        <OverrideModal
          deviceId={overrideModal.deviceId}
          deviceHostname={overrideModal.deviceHostname}
          existing={overrideModal.existing}
          onClose={() => setOverrideModal(null)}
          onSaved={reloadOverrides}
        />
      )}

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

      {/* Device list */}
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
            const policy    = getDevicePolicy(d.id);
            const activeOv  = deviceOverrides[d.id] ?? null;

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
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5">
                        <span className="text-xs text-surface-500">Visto {timeAgo(d.lastSeenAt)}</span>

                        {policy ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-navy-400 bg-navy-600/10 px-2 py-0.5 rounded border border-navy-600/15">
                            <Link className="w-3 h-3" />
                            {policy.name || 'Perfil'}: {formatTime(policy.timeStart)}–{formatTime(policy.timeEnd)}
                            <span className="text-navy-500 ml-1">
                              {policy.allowedDays.map(day => DAY_LABELS[day]).join(', ')}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-amber-500/70 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                            Sem perfil vinculado
                          </span>
                        )}

                        {activeOv && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <Clock className="w-3 h-3" />
                            Hora extra até {activeOv.extendedEnd.slice(0, 5)}
                            {activeOv.reason && (
                              <span className="text-emerald-500/70 ml-0.5">· {activeOv.reason}</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Hora Extra button */}
                    <button
                      onClick={() => setOverrideModal({ deviceId: d.id, deviceHostname: d.hostname, existing: activeOv })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        activeOv
                          ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20'
                          : 'bg-surface-800 text-surface-400 hover:text-surface-200 hover:bg-surface-700'
                      }`}
                      title="Hora Extra">
                      <Clock className="w-3.5 h-3.5" />
                      {activeOv ? 'Hora extra ativa' : 'Hora extra'}
                    </button>

                    {/* Enable/disable */}
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
