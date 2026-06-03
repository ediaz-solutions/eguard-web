import { useState } from 'react';
import { Clock, Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { usePolicies } from '../hooks/useData';
import { api } from '../services/api';
import { formatTime } from '../utils';
import { DAY_LABELS, ALL_DAYS, type Policy } from '../types';

interface Form {
  name: string;
  allowedDays: string[];
  timeStart: string;
  timeEnd: string;
  warnMinutes: number;
}

const EMPTY: Form = {
  name: '',
  allowedDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
  timeStart: '08:00',
  timeEnd: '17:00',
  warnMinutes: 5,
};

export default function PoliciesPage() {
  const { data: policies, loading, reload } = usePolicies();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTargetId, setEditTargetId] = useState<string>('');
  const [editTargetType, setEditTargetType] = useState<string>('device');
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  function startCreate() { setForm(EMPTY); setEditId(null); setShowForm(true); }
  function startEdit(p: Policy) {
    setForm({
      name: p.name || '',
      allowedDays: p.allowedDays,
      timeStart: formatTime(p.timeStart),
      timeEnd: formatTime(p.timeEnd),
      warnMinutes: p.warnMinutes,
    });
    setEditId(p.id);
    setEditTargetId(p.targetId);
    setEditTargetType(p.targetType);
    setShowForm(true);
  }
  function cancel() { setShowForm(false); setEditId(null); setForm(EMPTY); }

  function toggleDay(d: string) {
    setForm(f => ({
      ...f,
      allowedDays: f.allowedDays.includes(d) ? f.allowedDays.filter(x => x !== d) : [...f.allowedDays, d],
    }));
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        targetType: editTargetType || 'device',
        targetId: editTargetId || '00000000-0000-0000-0000-000000000000',
        allowedDays: form.allowedDays,
        timeStart: form.timeStart + ':00',
        timeEnd: form.timeEnd + ':00',
        warnMinutes: form.warnMinutes,
        action: 'logoff',
      };
      if (editId) await api.updatePolicy(editId, payload);
      else await api.createPolicy(payload);
      cancel(); reload();
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function del(id: string) {
    if (!confirm('Remover este perfil?')) return;
    try { await api.deletePolicy(id); reload(); } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Perfis de Horário</h1>
          <p className="text-surface-400 text-sm mt-1">
            Crie perfis de horário independentes e vincule-os aos dispositivos
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
            <h2 className="font-semibold text-surface-100">{editId ? 'Editar perfil' : 'Novo perfil de horário'}</h2>
            <button onClick={cancel} className="text-surface-500 hover:text-surface-300"><X className="w-5 h-5" /></button>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Nome do perfil</label>
            <input type="text" className="input-field" placeholder="Ex: Horário Comercial, Turno Noturno"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Dias permitidos</label>
            <div className="flex gap-2">
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
              value={form.warnMinutes} onChange={e => setForm({ ...form, warnMinutes: +e.target.value })} />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={saving || !form.name.trim()} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />{saving ? 'Salvando...' : editId ? 'Atualizar' : 'Criar perfil'}
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
        <div className="card divide-y divide-surface-800/50">
          {!policies?.length ? (
            <div className="p-12 text-center text-surface-500">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nenhum perfil cadastrado</p>
              <p className="text-xs mt-1">Crie perfis de horário para vincular aos dispositivos</p>
            </div>
          ) : policies.map(p => (
            <div key={p.id} className="px-6 py-5 hover:bg-surface-800/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-600/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <span className="font-medium text-surface-100">{p.name || 'Sem nome'}</span>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-sm text-surface-300">{formatTime(p.timeStart)} — {formatTime(p.timeEnd)}</span>
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
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(p)}
                    className="p-2 rounded-lg text-surface-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                    title="Editar"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => del(p.id)}
                    className="p-2 rounded-lg text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remover"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
