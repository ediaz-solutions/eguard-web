export interface Device {
  id: string;
  hostname: string;
  lastSeenAt: string | null;
  active: boolean;
  isOnline: boolean;
  agentToken?: string;
}

export interface Policy {
  id: string;
  companyId: string;
  name: string;
  targetType: 'device' | 'user';
  targetId: string;
  allowedDays: string[];
  timeStart: string;
  timeEnd: string;
  warnMinutes: number;
  action: string;
  active: boolean;
  createdAt: string;
}

export interface AgentLog {
  id: string;
  deviceId: string;
  loggedUser: string | null;
  eventType: string;
  detail: string | null;
  occurredAt: string;
  sentAt: string;
}

export interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  activePolicies: number;
  recentLogoffs: number;
  recentLogs: AgentLog[];
  devices: Device[];
}

export const DAY_LABELS: Record<string, string> = {
  mon: 'Seg', tue: 'Ter', wed: 'Qua', thu: 'Qui',
  fri: 'Sex', sat: 'Sáb', sun: 'Dom',
};

export const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const EVENT_LABELS: Record<string, string> = {
  agent_started: 'Agente iniciado',
  agent_stopped: 'Agente parado',
  policy_applied: 'Política aplicada',
  policy_not_found: 'Sem política',
  offline_mode_active: 'Modo offline',
  warning_shown: 'Aviso exibido',
  logoff_executed: 'Logoff executado',
  logoff_cancelled: 'Logoff cancelado',
  api_error: 'Erro na API',
};
