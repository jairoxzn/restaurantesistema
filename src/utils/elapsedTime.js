// Umbrales (en minutos) para escalar la urgencia visual de un pedido en el KDS.
const WARNING_MINUTES = 8;
const CRITICAL_MINUTES = 15;

export function getElapsedMinutes(fecha, now = new Date()) {
  const diffMs = now.getTime() - new Date(fecha).getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
}

export function formatElapsed(minutes) {
  if (minutes < 1) return 'Recién';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function getUrgencyLevel(minutes) {
  if (minutes >= CRITICAL_MINUTES) return 'critical';
  if (minutes >= WARNING_MINUTES) return 'warning';
  return 'normal';
}

export const URGENCY_BADGE_CLASSES = {
  normal: 'bg-dark-800 text-dark-400 border-dark-700',
  warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40',
  critical: 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse',
};

export const URGENCY_RING_CLASSES = {
  normal: '',
  warning: '',
  critical: 'ring-2 ring-red-500/60',
};
