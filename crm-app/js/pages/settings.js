// settings.js — Settings page
import { showToast } from '../components/toast.js';
import { getAll } from '../data/store.js';

const container = document.getElementById('content');

container.innerHTML = `
<div class="card" style="max-width:600px">
  <h2 style="margin-bottom:20px">Settings</h2>
  <div style="display:grid;gap:16px">
    <div style="padding:16px;border:1px solid var(--color-border);border-radius:8px">
      <h3>Data Management</h3>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn--outline" id="export-all">Export All Data (JSON)</button>
        <button class="btn btn--danger" id="clear-all">Clear All Data</button>
      </div>
    </div>
    <div style="padding:16px;border:1px solid var(--color-border);border-radius:8px">
      <h3>About</h3>
      <p style="color:#999;margin-top:8px">CRM v1.0 — Built with HTML + CSS + Vanilla JS + IndexedDB</p>
    </div>
  </div>
</div>`;

document.getElementById('export-all').addEventListener('click', async () => {
  const data = {};
  for (const entity of ['leads', 'deals', 'campaigns', 'units']) {
    data[entity] = await getAll(entity);
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'crm-backup.json';
  a.click();
  showToast('Data exported', 'success');
});

document.getElementById('clear-all').addEventListener('click', () => {
  if (confirm('Delete ALL data? This cannot be undone.')) {
    indexedDB.deleteDatabase('crm_db');
    showToast('Database cleared. Reload page.', 'success');
  }
});
