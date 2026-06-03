import { useState } from 'react';
import { ScrollText, Filter, Monitor } from 'lucide-react';
import { useDevices, useDeviceLogs } from '../hooks/useData';
import { formatDate } from '../utils';
import { EVENT_LABELS } from '../types';

function Badge({ type }: { type: string }) {
  const s = type === 'logoff_executed' ? 'bg-red-500/10 text-red-400 border-red-500/20'
    : type === 'warning_shown' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    : type.includes('error') || type === 'policy_not_found' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    : 'bg-surface-700/50 text-surface-400 border-surface-700';
  return <span className={`inline-flex px-2.5 py-1 rounded text-xs font-medium border ${s}`}>{EVENT_LABELS[type] || type}</span>;
}

export default function LogsPage() {
  const { data: devices } = useDevices();
  const [sel, setSel] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const { data: logs, loading } = useDeviceLogs(sel);

  const filtered = logs?.filter(l => !filter || l.eventType === filter) || [];
  const types = [...new Set(logs?.map(l => l.eventType) || [])];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">Logs do Agente</h1>
        <p className="text-surface-400 text-sm mt-1">Histórico de eventos por dispositivo</p>
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1 max-w-xs">
          <label className="block text-sm font-medium text-surface-300 mb-2">
            <Monitor className="w-3.5 h-3.5 inline mr-1.5" />Dispositivo
          </label>
          <select className="input-field" value={sel || ''}
            onChange={e => { setSel(e.target.value || null); setFilter(''); }}>
            <option value="">Selecione</option>
            {devices?.map(d => <option key={d.id} value={d.id}>{d.hostname}</option>)}
          </select>
        </div>
        {sel && types.length > 0 && (
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-surface-300 mb-2">
              <Filter className="w-3.5 h-3.5 inline mr-1.5" />Tipo
            </label>
            <select className="input-field" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">Todos</option>
              {types.map(t => <option key={t} value={t}>{EVENT_LABELS[t] || t}</option>)}
            </select>
          </div>
        )}
      </div>

      {!sel ? (
        <div className="card p-12 text-center text-surface-500">
          <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Selecione um dispositivo</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-brand-600/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card">
          <div className="px-5 py-4 border-b border-surface-800">
            <span className="font-semibold text-surface-100 text-sm">{filtered.length} evento(s)</span>
          </div>
          {!filtered.length
            ? <div className="p-8 text-center text-surface-500 text-sm">Nenhum log</div>
            : <div className="divide-y divide-surface-800/50 max-h-[600px] overflow-y-auto">
                {filtered.map(l => (
                  <div key={l.id} className="px-5 py-3.5 hover:bg-surface-800/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge type={l.eventType} />
                        {l.loggedUser && <span className="text-sm text-surface-300 font-mono">{l.loggedUser}</span>}
                      </div>
                      <span className="text-xs text-surface-500 font-mono">{formatDate(l.occurredAt)}</span>
                    </div>
                    {l.detail && (
                      <pre className="mt-2 text-xs text-surface-500 bg-surface-800/50 rounded px-3 py-2 overflow-x-auto font-mono">
                        {(() => { try { return JSON.stringify(JSON.parse(l.detail), null, 2); } catch { return l.detail; } })()}
                      </pre>
                    )}
                  </div>
                ))}
              </div>}
        </div>
      )}
    </div>
  );
}
