export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatCurrency(amount) {
  if (amount == null) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(amount);
}

export function formatNumber(num) {
  if (num == null) return '-';
  return new Intl.NumberFormat('en-US').format(num);
}
