// deals.js — Deals table + filters + settings gear + Close/Won/Lost
// Fixes: B8 (client name click), B12 (Close button), B9 (settings gear)
import { getAll, add, bulkUpdate } from '../data/store.js';
import { renderDataTable } from '../components/data-table.js';
import { showToast } from '../components/toast.js';
import { openModal } from '../components/modal.js';
import { formatCurrency, formatDate } from '../utils/format.js';
import { AGENTS } from '../data/constants.js';

async function init() {
  const [leads, deals] = await Promise.all([getAll('leads'), getAll('deals')]);
  const actions = document.getElementById('topbar-actions');
  actions.innerHTML = `
    <a href="deal-insights.html" class="btn btn--outline btn--sm">📊 Insights</a>
    <a href="settings.html" class="btn btn--outline btn--sm" title="Settings">⚙️</a>
    <button class="btn btn--primary btn--sm" id="btn-new-deal">+ New Deal</button>
  `;

  const container = document.getElementById('content');

  // Seed deals if empty
  if (deals.length === 0) {
    const activeLeads = leads.filter(l => l.stage !== 'Closed Won' && l.stage !== 'Closed Lost').slice(0, 5);
    for (const lead of activeLeads) {
      await add('deals', {
        leadId: lead.id,
        status: 'Open',
        amount: Math.floor(Math.random() * 500000) + 50000,
        assignedTo: lead.assignedTo
      });
    }
  }

  let allDeals = await getAll('deals');

  function getLeadName(leadId) {
    const lead = leads.find(l => l.id === leadId);
    return lead ? lead.name : leadId;
  }

  // Filter bar for deals
  const filterDiv = document.createElement('div');
  filterDiv.className = 'filter-bar';
  filterDiv.innerHTML = `
    <div class="form-group"><label>Status</label><select id="deal-filter-status"><option value="">All</option><option value="Open">Open</option><option value="Won">Won</option><option value="Lost">Lost</option></select></div>
    <div class="form-group"><label>Agent</label><select id="deal-filter-agent"><option value="">All</option>${AGENTS.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}</select></div>
    <div class="form-group" style="align-self:flex-end"><button class="btn btn--primary btn--sm" id="deal-apply">Apply</button></div>
  `;
  container.appendChild(filterDiv);

  const tableDiv = document.createElement('div');
  tableDiv.id = 'deals-table';
  container.appendChild(tableDiv);

  function renderDeals(filtered) {
    const columns = [
      { key: 'id', label: 'Deal ID', render: (r) => `<strong style="color:var(--color-primary)">${r.id}</strong>` },
      { key: 'leadId', label: 'Client', render: (r) => `<a href="lead-detail.html?id=${r.leadId}" style="color:var(--color-primary);text-decoration:none;font-weight:600" onclick="event.stopPropagation()">${getLeadName(r.leadId)}</a>` },
      { key: 'status', label: 'Status', render: (r) => {
        const color = r.status === 'Open' ? '#FF8C00' : r.status === 'Won' ? '#4CAF50' : '#F44336';
        return `<span style="color:${color};font-weight:600">${r.status}</span>`;
      }},
      { key: 'amount', label: 'Amount', sortValue: (r) => r.amount, render: (r) => formatCurrency(r.amount) },
      { key: 'createdAt', label: 'Created', sortValue: (r) => r.createdAt, render: (r) => formatDate(r.createdAt) },
      { key: 'id', label: 'Action', render: (r) => r.status === 'Open'
        ? `<button class="btn btn--sm btn--outline" data-close="${r.id}">Close</button>`
        : '' }
    ];

    renderDataTable(tableDiv, {
      columns,
      rows: filtered,
      pageSize: 20
    });
  }

  renderDeals(allDeals);

  document.getElementById('deal-apply').addEventListener('click', () => {
    const status = document.getElementById('deal-filter-status').value;
    const agent = document.getElementById('deal-filter-agent').value;
    let filtered = allDeals;
    if (status) filtered = filtered.filter(d => d.status === status);
    if (agent) filtered = filtered.filter(d => d.assignedTo === agent);
    renderDeals(filtered);
  });

  // Close button handler — mandatory reason
  tableDiv.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-close]');
    if (!btn) return;
    const dealId = btn.dataset.close;

    function showCloseForm(outcome) {
      const color = outcome === 'Won' ? 'var(--color-primary)' : 'var(--color-danger)';
      openModal(`Close Deal as ${outcome}`, `
        <p style="margin-bottom:12px">Outcome: <strong style="color:${color}">${outcome}</strong></p>
        <div class="form-group"><label>Reason *</label><textarea id="close-reason" rows="3" placeholder="Why was this deal ${outcome.toLowerCase()}?" required></textarea></div>
        <div class="form-group"><label>Notes</label><textarea id="close-notes" rows="2" placeholder="Additional notes..."></textarea></div>
      `, [
        { id: 'confirm-close', label: 'Confirm', class: outcome === 'Won' ? 'btn--primary' : 'btn--danger', onClick: async () => {
          const reason = document.getElementById('close-reason').value.trim();
          if (!reason) return showToast('Reason is required', 'error');
          const notes = document.getElementById('close-notes').value.trim();
          await bulkUpdate('deals', [dealId], {
            status: outcome,
            closedDate: new Date().toISOString(),
            closeReason: reason,
            closeNotes: notes
          });
          showToast(`Deal closed as ${outcome}`, 'success');
          init();
        }}
      ]);
    }

    openModal('Close Deal', '<p>Select outcome:</p>', [
      { id: 'won', label: '✅ Closed Won', class: 'btn--primary', onClick: () => showCloseForm('Won') },
      { id: 'lost', label: '❌ Closed Lost', class: 'btn--danger', onClick: () => showCloseForm('Lost') }
    ]);
  });

  document.getElementById('btn-new-deal').addEventListener('click', async () => {
    const activeLeads = leads.filter(l => l.stage !== 'Closed Won' && l.stage !== 'Closed Lost');
    let html = '<div class="form-group"><label>Lead</label><select id="deal-lead"><option value="">Select lead...</option>';
    activeLeads.forEach(l => { html += `<option value="${l.id}">${l.name} (${l.id})</option>`; });
    html += '</select></div>';
    html += '<div class="form-group"><label>Amount (EGP)</label><input type="number" id="deal-amount" placeholder="50000"></div>';
    openModal('New Deal', html, [
      { id: 'create-deal', label: 'Create', class: 'btn--primary', onClick: async () => {
        const leadId = document.getElementById('deal-lead').value;
        const amount = parseInt(document.getElementById('deal-amount').value) || 0;
        if (!leadId || amount <= 0) return showToast('Fill all fields', 'error');
        await add('deals', { leadId, status: 'Open', amount, assignedTo: leads.find(l => l.id === leadId)?.assignedTo });
        showToast('Deal created', 'success');
        init();
      }}
    ]);
  });
}

init();
