// marketing.js — Campaigns list + KPIs (lead count, deal count)
import { getAll, bulkDelete } from '../data/store.js';
import { renderDataTable } from '../components/data-table.js';
import { showToast } from '../components/toast.js';
import { openModal } from '../components/modal.js';
import { formatDate, formatCurrency } from '../utils/format.js';

async function init() {
  document.getElementById('topbar-actions').innerHTML = '<a href="marketing-add.html" class="btn btn--primary">+ New Campaign</a> <a href="settings.html" class="btn btn--outline btn--sm" title="Settings">⚙️</a>';
  const [campaigns, leads, deals] = await Promise.all([getAll('campaigns'), getAll('leads'), getAll('deals')]);
  const container = document.getElementById('content');

  const campaignStats = campaigns.map(c => {
    const linkedLeads = leads.filter(l => (l.campaigns || []).includes(c.id));
    const linkedDeals = deals.filter(d => {
      const lead = leads.find(l => l.id === d.leadId);
      return lead && (lead.campaigns || []).includes(c.id);
    });
    const wonDeals = linkedDeals.filter(d => d.status === 'Won');
    const totalValue = wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
    return { ...c, leadCount: linkedLeads.length, dealCount: linkedDeals.length, wonCount: wonDeals.length, totalValue };
  });

  // KPI summary cards
  const totalLeads = campaignStats.reduce((s, c) => s + c.leadCount, 0);
  const totalDeals = campaignStats.reduce((s, c) => s + c.dealCount, 0);
  const totalWon = campaignStats.reduce((s, c) => s + c.wonCount, 0);
  const totalValue = campaignStats.reduce((s, c) => s + c.totalValue, 0);

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px">
      <div class="card" style="text-align:center;padding:16px"><div style="font-size:24px;font-weight:700;color:var(--color-primary)">${campaigns.length}</div><div style="color:#999;font-size:13px">Campaigns</div></div>
      <div class="card" style="text-align:center;padding:16px"><div style="font-size:24px;font-weight:700;color:#2196F3">${totalLeads}</div><div style="color:#999;font-size:13px">Total Leads</div></div>
      <div class="card" style="text-align:center;padding:16px"><div style="font-size:24px;font-weight:700;color:#FF8C00">${totalDeals}</div><div style="color:#999;font-size:13px">Total Deals</div></div>
      <div class="card" style="text-align:center;padding:16px"><div style="font-size:24px;font-weight:700;color:#4CAF50">${formatCurrency(totalValue)}</div><div style="color:#999;font-size:13px">Won Value</div></div>
    </div>
  `;

  const tableDiv = document.createElement('div');
  tableDiv.id = 'campaign-table';
  container.appendChild(tableDiv);

  const columns = [
    { key: 'id', label: 'ID', render: (r) => `<strong style="color:var(--color-primary)">${r.id}</strong>` },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status', render: (r) => {
      const c = r.status === 'Active' ? '#4CAF50' : r.status === 'Completed' ? '#2196F3' : '#999';
      return `<span style="color:${c};font-weight:600">${r.status}</span>`;
    }},
    { key: 'leadCount', label: 'Leads', render: (r) => `<strong>${r.leadCount || 0}</strong>` },
    { key: 'dealCount', label: 'Deals', render: (r) => `<strong>${r.dealCount || 0}</strong>` },
    { key: 'wonCount', label: 'Won', render: (r) => `<strong style="color:#4CAF50">${r.wonCount || 0}</strong>` },
    { key: 'totalValue', label: 'Revenue', sortValue: (r) => r.totalValue, render: (r) => formatCurrency(r.totalValue) },
    { key: 'startDate', label: 'Start', render: (r) => formatDate(r.startDate) },
    { key: 'id', label: '', render: (r) => `<button class="btn btn--sm btn--danger" data-delete="${r.id}">Delete</button>` }
  ];

  renderDataTable(tableDiv, { columns, rows: campaignStats });

  tableDiv.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-delete]');
    if (!btn) return;
    openModal('Delete Campaign', '<p>Delete this campaign?</p>', [
      { id: 'yes', label: 'Delete', class: 'btn--danger', onClick: async () => {
        await bulkDelete('campaigns', [btn.dataset.delete]);
        showToast('Campaign deleted', 'success');
        init();
      }}
    ]);
  });
}
init();
