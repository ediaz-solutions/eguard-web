import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function timeAgo(d: string | null): string {
  if (!d) return 'Nunca';
  try { return formatDistanceToNow(parseISO(d), { addSuffix: true, locale: ptBR }); }
  catch { return '—'; }
}

export function formatDate(d: string): string {
  try { return format(parseISO(d), "dd/MM/yyyy HH:mm", { locale: ptBR }); }
  catch { return d; }
}

export function formatTime(t: string): string { return t.slice(0, 5); }
