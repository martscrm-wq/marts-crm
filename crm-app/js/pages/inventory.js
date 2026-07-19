// inventory.js — T310: Units list with search (REQ-701, REQ-702)
import { getAll, bulkDelete } from '../data/store.js';
import { renderDataTable } from '../components/data-table.js';
import { showToast } from '../components/toast.js';
import { openModal } from '../components/modal.js';
import { formatCurrency } from '../utils/format.js';

async function init() {
  document.getElementById('topbar-actions').innerHTML = '<a href="inventory-add.html" class="btn btn--primary">+ Add Unit</a> <a href="settings.html" class="btn btn--outline btn--sm" title="Settings">⚙️</a>';
  let units = await getAll('units');
  const container = document.getElementById('content');

  // Search bar (REQ-702: title, location, type, price)
  const searchDiv = document.createElement('div');
  searchDiv.className = 'filter-bar';
  searchDiv.innerHTML = `<div class="form-group" style="min-width:300px"><label>Search</label><input type="text" id="inv-search" placeholder="Title, location, type, or price..."></div>`;
  container.appendChild(searchDiv);

  const tableDiv = document.createElement('div');
  tableDiv.id = 'inv-table';
  container.appendChild(tableDiv);

  function renderTable(filteredUnits) {
    renderDataTable(tableDiv, {
      columns: [
        { key: 'id', label: 'ID', render: (r) => `<strong style="color:var(--color-primary)">${r.id}</strong>` },
        { key: 'unitType', label: 'Type' },
        { key: 'location', label: 'Location' },
        { key: 'area', label: 'Area (m²)' },
        { key: 'price', label: 'Price', sortValue: (r) => r.price, render: (r) => formatCurrency(r.price) },
        { key: 'status', label: 'Status', render: (r) => `<span style="color:${r.status==='Published'?'#4CAF50':'#999'};font-weight:600">${r.status}</span>` },
        { key: 'id', label: '', render: (r) => `
          <a href="inventory-detail.html?id=${r.id}" class="btn btn--sm btn--outline">View</a>
          <button class="btn btn--sm btn--danger" data-del="${r.id}">Del</button>` }
      ],
      rows: filteredUnits
    });
  }

  renderTable(units);

  document.getElementById('inv-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = units.filter(u =>
      (u.unitType && u.unitType.toLowerCase().includes(q)) ||
      (u.location && u.location.toLowerCase().includes(q)) ||
      (u.description && u.description.toLowerCase().includes(q)) ||
      (u.area && String(u.area).includes(q)) ||
      (u.price && String(u.price).includes(q))
    );
    renderTable(filtered);
  });

  tableDiv.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-del]');
    if (!btn) return;
    openModal('Delete Unit', '<p>Delete this unit?</p>', [
      { id: 'yes', label: 'Delete', class: 'btn--danger', onClick: async () => {
        await bulkDelete('units', [btn.dataset.del]);
        showToast('Unit deleted', 'success');
        init();
      }}
    ]);
  });
}
init();
