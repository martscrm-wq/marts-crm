export function openModal(title, bodyHtml, actions = []) {
  close();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  const modal = document.createElement('div');
  modal.className = 'modal';
  let actionsHtml = actions.map(a =>
    `<button class="btn ${a.class || ''}" id="modal-btn-${a.id}">${a.label}</button>`
  ).join('');
  modal.innerHTML = `
    <div class="modal__title">${title}</div>
    <div class="modal__body">${bodyHtml}</div>
    <div class="modal__actions">${actionsHtml}<button class="btn" id="modal-btn-close">Cancel</button></div>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.getElementById('modal-btn-close').addEventListener('click', close);
  actions.forEach(a => {
    const btn = document.getElementById(`modal-btn-${a.id}`);
    if (btn && a.onClick) btn.addEventListener('click', () => { a.onClick(); close(); });
  });
  document.addEventListener('keydown', escHandler);
}

export function confirm(title, message) {
  return new Promise((resolve) => {
    openModal(title, `<p>${message}</p>`, [
      { id: 'ok', label: 'Confirm', class: 'btn--danger', onClick: () => resolve(true) }
    ]);
    const origClose = close;
    const checkResolve = () => resolve(false);
  });
}

function escHandler(e) { if (e.key === 'Escape') close(); }

export function close() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.remove();
  document.removeEventListener('keydown', escHandler);
}
