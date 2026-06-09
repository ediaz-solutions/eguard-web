import { useState } from 'react';
import { Clock, Plus, Pencil, Trash2, X, Save, Monitor, User, Link, Link2Off } from 'lucide-react';
import { usePolicies, useDevices, useWindowsUsers } from '../hooks/useData';
import { api } from '../services/api';
import { formatTime } from '../utils';
import { DAY_LABELS, ALL_DAYS, type Policy } from '../types';

// ── Profile form (create / edit schedule) ────────────────────────────────────

interface ProfileForm {
  name: string;
  allowedDays: string[];
  timeStart: string;
  timeEnd: string;
  warnMinutes: number;
}

const EMPTY_FORM: ProfileForm = {
  name: '',
  allowedDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
  timeStart: '08:00',
  timeEnd: '17:00',
  warnMinutes: 5,
};

// ── Assign modal ──────────────────────────────────────────────────────────────

interface AssignModalProps {
  policy: Policy;
  onClose: () => void;
  onSaved: () => void;
}

function AssignModal({ policy, onClose, onSaved }: AssignModalProps) {
  const { data: devices } = useDevices();
  const { data: users } = useWindowsUsers();

  const [targetType, setTargetType] = useState<'device' | 'user'>('device');
  const [targetId, setTargetId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const options = targetType === 'device'
    ? (devices ?? []).map(d => ({ id: d.id, label: d.hostname }))
    : (users ?? []).filter(u => u.active).map(u => ({ id: u.id, label: u.username }));

  async function assign() {
    if (!targetId) { setError('Selecione um alvo'); return; }
    setSaving(true); setError('');
    try {
      await api.createAssignment(policy.id, targetType, targetId);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atribuir');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-900 border border-surface-700 rounded-xl shadow-2xl w-full max-w-md mx-4 animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800">
          <div>
            <h3 className="font-semibold text-surface-100">Atribuir perfil</h3>
            <p className="text-xs text-surface-400 mt-0.5">{policy.name || 'Sem nome'}</p>
          </div>
          <button onClick={onClose} className="text-surface-500 hover:text-surface-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Tipo</label>
            <div className="flex gap-2">
              {(['device', 'user'] as const).map(t => (
                <button key={t}
                  onClick={() => { setTargetType(t); setTargetId(''); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                    targetType === t
                      ? 'bg-brand-600/10 text-brand-400 border-brand-600/30'
                      : 'bg-surface-800 text-surface-400 border-surface-700 hover:bg-surface-700'
                  }`}>
                  {t === 'device' ? <Monitor className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  {t === 'device' ? 'Dispositivo' : 'Usuário Windows'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">
              {targetType === 'device' ? 'Dispositivo' : 'Usuário'}
            </label>
            <select className="input-field" value={targetId}
              onChange={e => setTargetId(e.target.value)}>
              <option value="">Selecione...</option>
              {options.map(o => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-surface-500 mt-1.5">
              Se o alvo já tiver outro perfil, será substituído automaticamente.
            </p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-surface-800 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
          <button onClick={assign} disabled={saving || !targetId} className="btn-primary text-sm flex items-center gap-2">
            <Link className="w-4 h-4" />
            {saving ? 'Atribuindo...' : 'Atribuir'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PoliciesPage() {
  const { data: policies, loading, reload } = usePolicies();
  const { data: devices } = useDevices();
  const { data: users } = useWindowsUsers();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Assign modal
  const [assignPolicy, setAssignPolicy] = useState<Policy | null>(null);

  function startCreate() { setForm(EMPTY_FORM); setEditId(null); setError(''); setShowForm(true); }

  function startEdit(p: Policy) {
    setForm({
      name: p.name || '',
      allowedDays: p.allowedDays,
      timeStart: formatTime(p.timeStart),
      timeEnd: formatTime(p.timeEnd),
      warnMinutes: p.warnMinutes,
    });
    setEditId(p.id);
    setError('');
    setShowForm(true);
  }

  function cancel() { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); setError(''); }

  function toggleDay(d: string) {
    setForm(f => ({
      ...f,
      allowedDays: f.allowedDays.includes(d)
        ? f.allowedDays.filter(x => x !== d)
        : [...f.allowedDays, d],
    }));
  }

  async function save() {
    if (!form.name.trim()) { setError('Informe o nome do perfil'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name.trim(),
        allowedDays: form.allowedDays,
        timeStart: form.timeStart + ':00',
        timeEnd: form.timeEnd + ':00',
        warnMinutes: form.warnMinutes,
        action: 'logoff',
      };
      if (editId) await api.updatePolicy(editId, payload);
      else await api.createPolicy(payload);
      cancel(); reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function del(id: string) {
    if (!confirm('Remover este perfil? As atribuições existentes serão removidas também.')) return;
    try { await api.deletePolicy(id); reload(); } catch {}
  }

  async function unassign(assignmentId: string) {
    try { await api.deleteAssignment(assignmentId); reload(); } catch {}
  }

  function getTargetLabel(type: 'device' | 'user', targetId: string) {
    if (type === 'device') return devices?.find(d => d.id === targetId)?.hostname ?? targetId.slice(0, 8) + '…';
    return users?.find(u => u.id === targetId)?.username ?? targetId.slice(0, 8) + '…';
  }

  return (
    <div className="space-y-6">
      {assignPolicy && (
        <AssignModal
          policy={assignPolicy}
          onClose={() => setAssignPolicy(null)}
          onSaved={reload}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Perfis de Horário</h1>
          <p className="text-surface-400 text-sm mt-1">
            Crie perfis independentes e atribua-os a dispositivos ou usuários
          </p>
        </div>
        <button onClick={startCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />Novo perfil
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 animate-slide-up space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-surface-100">
              {editId ? 'Editar perfil' : 'Novo perfil de horário'}
            </h2>
            <button onClick={cancel} className="text-surface-500 hover:text-surface-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Nome do perfil</label>
            <input type="text" className="input-field"
              placeholder="Ex: Horário Comercial, Turno Noturno"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Dias permitidos</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_DAYS.map(d => (
                <button key={d} onClick={() => toggleDay(d)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    form.allowedDays.includes(d)
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-900/30'
                      : 'bg-surface-800 text-surface-400 hover:bg-surface-700'
                  }`}>{DAY_LABELS[d]}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Início</label>
              <input type="time" className="input-field" value={form.timeStart}
                onChange={e => setForm({ ...form, timeStart: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Fim</label>
              <input type="time" className="input-field" value={form.timeEnd}
                onChange={e => setForm({ ...form, timeEnd: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Aviso prévio (min)</label>
            <input type="number" min={0} max={60} className="input-field w-32"
              value={form.warnMinutes}
              onChange={e => setForm({ ...form, warnMinutes: +e.target.value })} />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={saving || !form.name.trim()}
              className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : editId ? 'Atualizar' : 'Criar perfil'}
            </button>
            <button onClick={cancel} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-brand-600/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {!policies?.length ? (
            <div className="card p-12 text-center text-surface-500">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nenhum perfil cadastrado</p>
              <p className="text-xs mt-1">
                Crie perfis de horário e depois atribua-os a dispositivos ou usuários
              </p>
            </div>
          ) : policies.map(p => (
            <div key={p.id} className="card p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-600/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-surface-100">{p.name || 'Sem nome'}</span>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5">
                      <span className="text-sm text-surface-300 font-mono">
                        {formatTime(p.timeStart)} — {formatTime(p.timeEnd)}
                      </span>
                      <div className="flex gap-1">
                        {ALL_DAYS.map(d => (
                          <span key={d} className={`text-xs px-1.5 py-0.5 rounded ${
                            p.allowedDays.includes(d)
                              ? 'bg-brand-600/20 text-brand-400'
                              : 'bg-surface-800/50 text-surface-600'
                          }`}>{DAY_LABELS[d]}</span>
                        ))}
                      </div>
                      <span className="text-xs text-surface-500">Aviso: {p.warnMinutes}min</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setAssignPolicy(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                               bg-surface-800 text-surface-400 hover:text-brand-400 hover:bg-brand-500/10
                               border border-surface-700 transition-colors"
                    title="Atribuir a dispositivo ou usuário">
                    <Link className="w-3.5 h-3.5" />Atribuir
                  </button>
                  <button onClick={() => startEdit(p)}
                    className="p-2 rounded-lg text-surface-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                    title="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => del(p.id)}
                    className="p-2 rounded-lg text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remover">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Assignments */}
              {p.assignments.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-surface-800/60">
                  <p className="text-xs text-surface-500 mb-2">
                    Atribuído a {p.assignments.length} {p.assignments.length === 1 ? 'alvo' : 'alvos'}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {p.assignments.map(a => (
                      <span key={a.id}
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${
                          a.targetType === 'user'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                            : 'bg-brand-500/10 text-brand-300 border-brand-500/20'
                        }`}>
                        {a.targetType === 'user'
                          ? <User className="w-3 h-3" />
                          : <Monitor className="w-3 h-3" />}
                        {getTargetLabel(a.targetType, a.targetId)}
                        <button
                          onClick={() => unassign(a.id)}
                          className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                          title="Remover atribuição">
                          <Link2Off className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-surface-800/60">
                  <p className="text-xs text-amber-500/70">
                    Nenhum alvo atribuído — clique em "Atribuir" para vincular a um dispositivo ou usuário.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
