export function fmtDate (val) {
  if (!val) return '—';
  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d)) return String(val);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function resolveProcessStatus (model) {
  const ref = model?.['v-wf2:processStatus']?.[0];
  if (!ref) return 'Unknown';
  const id = typeof ref === 'string' ? ref : ref.id;
  if (id === 'v-wf2:ProcessRunning') return 'Running';
  if (id === 'v-wf2:ProcessCompleted') return 'Completed';
  if (id === 'v-wf2:ProcessCancelled') return 'Cancelled';
  if (id === 'v-wf2:ProcessFailed') return 'Failed';
  return id.split(':').pop();
}

const STATE_CLASS_MAP = { Running: 'state-running', Completed: 'state-completed', Cancelled: 'state-cancelled', Failed: 'state-failed' };

export function statusClass (label) {
  return STATE_CLASS_MAP[label] || 'state-unknown';
}

const monthsMap = {
  0: 'января',
  1: 'февраля',
  2: 'марта',
  3: 'апреля',
  4: 'мая',
  5: 'июня',
  6: 'июля',
  7: 'августа',
  8: 'сентября',
  9: 'октября',
  10: 'ноября',
  11: 'декабря'
};

export function formatDate(date) {
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
  const day = date.getDate();
  const month = monthsMap[date.getMonth()];
  const year = date.getFullYear();
  let formattedDate = `${day} ${month} ${year}`;
  if (hasTime) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    formattedDate += `, ${hours}:${minutes}`;
  }
  
  return formattedDate;
}

export function formatInitials(str) {
  if (!str) return '';
  
  const words = str.trim().split(/\s+/);
  
  const initials = words
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
    
  return initials;
}