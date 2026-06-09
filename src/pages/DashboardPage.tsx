import { Monitor, MonitorCheck, MonitorX, Clock, ShieldAlert, RefreshCw } from 'lucide-react';
import { useDashboard } from '../hooks/useData';
import { timeAgo, formatDate } from '../utils';
import { EVENT_LABELS } from '../types';

function Stat({ icon: I, label, value, color }: {
  icon: typeof Monitor; label: string; value: number | string; color: string;
}) {
  return (
    <div className="stat-card animate-slide-up">
      <div className="flex items-center justify-between">
        <span className="text-surface-400 text-sm">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <I className="w-4 h-4" />
        </div>
      </div>
      <span className="text-2xl font-bold text-surface-50 mt-1">{value}</span>
    </div>
  );
}

function Badge({ type }: { type: string }) {
  const s = type === 'logoff_executed'   ? 'bg-red-500/10 text-red-400'
    : type === 'warning_shown'           ? 'bg-amber-500/10 text-amber-400'
    : type === 'watchdog_alert'          ? 'bg-red-500/10 text-red-400'
    : type.includes('error') || type === 'policy_not_found' ? 'bg-orange-500/10 text-orange-400'
    : 'bg-surface-700/50 text-surface-400';
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${s}`}>{EVENT_LABELS[type] || type}</span>;
}

export default function DashboardPage() {
  const { stats, loading, error, reload } = useDashboard();

  if (loading && !stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-600/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
  if (!stats) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-surface-400">
      <ShieldAlert className="w-10 h-10 opacity-40" />
      <p className="text-sm">{error ?? 'Não foi possível carregar o dashboard.'}</p>
      <button onClick={reload} className="btn-secondary text-sm flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />Tentar novamente
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Dashboard</h1>
          <p className="text-surface-400 text-sm mt-1">Visão geral do sistema</p>
        </div>
        <button onClick={reload} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" />Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Monitor}      label="Dispositivos"  value={stats.totalDevices}   color="bg-surface-700/50 text-surface-300" />
        <Stat icon={MonitorCheck} label="Online"        value={stats.onlineDevices}  color="bg-emerald-500/10 text-emerald-400" />
        <Stat icon={MonitorX}     label="Offline"       value={stats.offlineDevices} color="bg-surface-700/50 text-surface-400" />
        <Stat icon={Clock}        label="Perfis ativos" value={stats.activePolicies} color="bg-navy-600/15 text-navy-400" />
      </div>

      {/* Hora Extra hoje */}
      {stats.todayOverrides.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-surface-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-surface-100">Hora Extra ativa hoje</h2>
            <span className="ml-auto text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {stats.todayOverrides.length} dispositivo(s)
            </span>
          </div>
          <div className="divide-y divide-surface-800/50">
            {stats.todayOverrides.map(ov => (
              <div key={ov.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-surface-500" />
                  <div>
                    <span className="text-sm font-medium text-surface-200 font-mono">{ov.deviceHostname}</span>
                    {ov.reason && (
                      <p className="text-xs text-surface-500 mt-0.5">{ov.reason}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                  até {ov.extendedEnd.slice(0, 5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Devices */}
        <div className="card">
          <div className="px-5 py-4 border-b border-surface-800 flex items-center justify-between">
            <h2 className="font-semibold text-surface-100">Dispositivos</h2>
            <span className="text-xs text-surface-500">{stats.onlineDevices}/{stats.totalDevices} online</span>
          </div>
          <div className="divide-y divide-surface-800/50">
            {stats.devices.length === 0
              ? <div className="p-8 text-center text-surface-500 text-sm">Nenhum dispositivo</div>
              : stats.devices.map(d => (
                <div key={d.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-4 h-4 text-surface-500" />
                    <div>
                      <span className="text-sm font-medium text-surface-200 font-mono">{d.hostname}</span>
                      <p className="text-xs text-surface-500 mt-0.5">Visto {timeAgo(d.lastSeenAt)}</p>
                    </div>
                  </div>
                  {d.isOnline
                    ? <span className="badge-online"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />Online</span>
                    : <span className="badge-offline">Offline</span>}
                </div>
              ))}
          </div>
        </div>

        {/* Activity */}
        <div className="card">
          <div className="px-5 py-4 border-b border-surface-800 flex items-center justify-between">
            <h2 className="font-semibold text-surface-100">Atividade recente</h2>
            {stats.recentLogoffs > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
                <ShieldAlert className="w-3 h-3" />{stats.recentLogoffs} logoff(s)
              </span>
            )}
          </div>
          <div className="divide-y divide-surface-800/50 max-h-[400px] overflow-y-auto">
            {stats.recentLogs.length === 0
              ? <div className="p-8 text-center text-surface-500 text-sm">Sem atividade recente</div>
              : stats.recentLogs.map(l => (
                <div key={l.id} className="px-5 py-3 flex items-center justify-between">
                  <Badge type={l.eventType} />
                  <span className="text-xs text-surface-500">{formatDate(l.occurredAt)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
