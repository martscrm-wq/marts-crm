export function showSpinner(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div><span>Loading...</span></div>';
}

export function hideSpinner(containerId) {
  const el = document.getElementById(containerId);
  if (el) {
    const s = el.querySelector('.spinner-wrap');
    if (s) s.remove();
  }
}
