const PREFIXES = { leads: 'LD', deals: 'DL', campaigns: 'CM', units: 'UN' };
const PAD = 6;

function getCounter(key) {
  return parseInt(localStorage.getItem(`crm_counter_${key}`) || '0', 10);
}

function setCounter(key, val) {
  localStorage.setItem(`crm_counter_${key}`, String(val));
}

export function generateId(entity) {
  const prefix = PREFIXES[entity] || 'XX';
  const next = getCounter(entity) + 1;
  setCounter(entity, next);
  return `${prefix}-${String(next).padStart(PAD, '0')}`;
}
