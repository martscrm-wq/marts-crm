// leads.js — Full leads page with enhanced bulk actions, history, exports
import { getAll, bulkUpdate, bulkDelete, update, add, cleanupExpiredTrash } from '../data/store.js';
import { AGENTS, SOURCES } from '../data/constants.js';
import { renderDataTable } from '../components/data-table.js';
import { renderFilterBar, applyLeadFilters } from '../components/filter-bar.js';
import { showToast } from '../components/toast.js';
import { openModal } from '../components/modal.js';
import { formatDate } from '../utils/format.js';
import { exportCSV, exportExcel, exportPDF, exportJSON } from '../utils/export.js';
import { logBulkAction, getBulkHistory, undoBulkAction } from '../data/history.js';

let allLeads = [];
let filteredLeads = [];
let tableInstance = null;

const COLUMNS = [
  { key: 'id', label: 'Code', render: (r) => `<strong style="color:var(--color-primary)">${r.id}</strong>` },
  { key: 'name', label: 'Name', render: (r) => `<a href="lead-detail.html?id=${r.id}" style="color:var(--color-primary);text-decoration:none;font-weight:600">${r.name}</a>` },
  { key: 'phone', label: 'Phone' },
  { key: 'rating', label: 'Rating', render: (r) => `<span class="badge badge--${(r.rating||'').toLowerCase()}">${r.rating||'-'}</span>` },
  { key: 'stage', label: 'Stage' },
  { key: 'source', label: 'Source' },
  { key: 'assignedTo', label: 'Agent', render: (r) => { const a = AGENTS.find(x => x.id === r.assignedTo); return a ? a.name : r.assignedTo; }},
  { key: 'createdDate', label: 'Created', sortValue: (r) => r.createdDate, render: (r) => formatDate(r.createdDate) }
];

const EXPORT_COLUMNS = [
  { key: 'id', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' }, { key: 'source', label: 'Source' }, { key: 'rating', label: 'Rating' },
  { key: 'stage', label: 'Stage' },
  { key: 'assignedTo', label: 'Assigned To', render: (r) => { const a = AGENTS.find(x => x.id === r.assignedTo); return a ? a.name : r.assignedTo; }},
  { key: 'createdDate', label: 'Created Date' }, { key: 'activityDate', label: 'Activity Date' },
  { key: 'assignmentDate', label: 'Assignment Date' }, { key: 'note', label: 'Note' }
];

const ALL_BULK_ACTIONS = [
  { value: 'reassign', label: 'Reassign' },
  { value: 'changeStage', label: 'Change Stage' },
  { value: 'markTodos', label: 'Mark Todos Complete' },
  { value: 'deferTodos', label: 'Defer Todos' },
  { value: 'addTag', label: 'Add Tag' },
  { value: 'removeTag', label: 'Remove Tag' },
  { value: 'addTask', label: 'Add Task' },
  { value: 'nudge', label: 'Bulk Nudge' },
  { value: 'addToCampaign', label: 'Add to Campaign' },
  { value: 'changeRating', label: 'Change Rating' },
  { value: 'changeSource', label: 'Change Source' },
  { value: 'changeWallet', label: 'Change Wallet' },
  { value: 'addBulkNote', label: 'Add Bulk Note' },
  { value: 'mergeLeads', label: 'Merge Leads' },
  { value: 'bulkDelete', label: 'Delete (Trash)' }
];

async function loadLeads() {
  allLeads = await getAll('leads');
  applyFilters({});
}

function applyFilters(filters) {
  filteredLeads = applyLeadFilters(allLeads, filters);
  renderTable();
}

function renderTable() {
  const tableContainer = document.getElementById('leads-table');
  const bulkBar = document.getElementById('bulk-bar');
  const bulkCount = document.getElementById('bulk-count');

  tableInstance = renderDataTable(tableContainer, {
    columns: COLUMNS,
    rows: filteredLeads,
    pageSize: 20,
    onRowClick: (id) => { window.location.href = `lead-detail.html?id=${id}`; },
    onSelectChange: (selected) => {
      if (selected.length > 0) {
        bulkBar.classList.remove('hidden');
        bulkCount.textContent = selected.length;
      } else {
        bulkBar.classList.add('hidden');
      }
    }
  });
}

function getSelectedLeadSnapshots(ids) {
  return ids.map(id => {
    const lead = allLeads.find(l => l.id === id);
    return lead ? JSON.parse(JSON.stringify(lead)) : null;
  }).filter(Boolean);
}

function renderBulkActions() {
  const container = document.getElementById('bulk-bar');
  let optionsHtml = '<option value="">Choose action...</option>';
  ALL_BULK_ACTIONS.forEach(a => {
    const cls = a.value === 'bulkDelete' ? ' style="color:#F44336"' : '';
    optionsHtml += `<option value="${a.value}"${cls}>${a.label}</option>`;
  });

  container.innerHTML = `
    <span id="bulk-count">0</span> selected
    <select id="bulk-action" class="btn btn--sm">${optionsHtml}</select>
    <button class="btn btn--primary btn--sm" id="bulk-execute">Execute</button>
    <button class="btn btn--sm" id="bulk-cancel">Cancel</button>
    <div style="flex:1"></div>
    <div id="bulk-progress" class="progress-bar hidden" style="width:120px"><div id="bulk-progress-fill" class="progress-bar__fill" style="width:0%"></div></div>
    <button class="btn btn--sm btn--outline" id="show-history">History</button>
  `;
  container.classList.add('hidden');

  document.getElementById('bulk-cancel').addEventListener('click', () => {
    tableInstance.clearSelection();
    container.classList.add('hidden');
  });

  document.getElementById('show-history').addEventListener('click', showBulkHistory);

  document.getElementById('bulk-execute').addEventListener('click', async () => {
    const action = document.getElementById('bulk-action').value;
    const selected = tableInstance.getSelected();
    if (!action || selected.length === 0) return showToast('Select an action and at least one lead', 'error');
    await executeBulkAction(action, selected);
  });
}

async function executeBulkAction(action, selected) {
  const previousState = getSelectedLeadSnapshots(selected);
  const progressBar = document.getElementById('bulk-progress');
  const progressFill = document.getElementById('bulk-progress-fill');

  function updateProgress(current, total) {
    if (progressBar && progressFill) {
      progressBar.classList.remove('hidden');
      progressFill.style.width = Math.round((current / total) * 100) + '%';
    }
  }
  function hideProgress() { if (progressBar) progressBar.classList.add('hidden'); }

  if (action === 'bulkDelete') {
    openModal('Confirm Delete', `<p>⚠ Move ${selected.length} leads to trash? They will be permanently deleted after 30 days.</p>`, [
      { id: 'confirm-delete', label: 'Move to Trash', class: 'btn--danger', onClick: async () => {
        updateProgress(0, selected.length);
        const trashDate = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
        for (let i = 0; i < selected.length; i++) {
          await update('leads', selected[i], { isDeleted: true, deletedAt: trashDate, expiresAt });
          updateProgress(i + 1, selected.length);
        }
        await logAction('bulkDelete', selected, previousState, { count: selected.length });
        showToast(`${selected.length} leads moved to trash (30 days)`, 'success');
        hideProgress();
        tableInstance.clearSelection();
        document.getElementById('bulk-bar').classList.add('hidden');
        loadLeads();
      }}
    ]);
    return;
  }

  if (action === 'reassign') {
    let html = '<div class="form-group"><label>Select new agent</label><select id="bulk-reassign-agent"><option value="">Choose...</option>';
    AGENTS.forEach(a => { html += `<option value="${a.id}">${a.name}</option>`; });
    html += '</select></div>';
    openModal('Reassign Leads', html, [
      { id: 'do-reassign', label: 'Apply', class: 'btn--primary', onClick: async () => {
        const agentId = document.getElementById('bulk-reassign-agent').value;
        if (!agentId) return showToast('Select an agent', 'error');
        const agentName = AGENTS.find(a => a.id === agentId)?.name || agentId;
        await bulkUpdate('leads', selected, { assignedTo: agentId, assignmentDate: new Date().toISOString().split('T')[0] });
        await logAction('reassign', selected, previousState, { newAgent: agentId, newAgentName: agentName });
        showToast(`${selected.length} leads reassigned to ${agentName}`, 'success');
        loadLeads();
      }}
    ]);
    return;
  }

  if (action === 'changeStage') {
    let html = '<div class="form-group"><label>Select new stage</label><select id="bulk-stage"><option value="">Choose...</option>';
    ['New','Contacted','Qualified','Proposal','Negotiation','Closed Won','Closed Lost'].forEach(s => { html += `<option value="${s}">${s}</option>`; });
    html += '</select></div>';
    openModal('Change Stage', html, [
      { id: 'do-stage', label: 'Apply', class: 'btn--primary', onClick: async () => {
        const stage = document.getElementById('bulk-stage').value;
        if (!stage) return showToast('Select a stage', 'error');
        await bulkUpdate('leads', selected, { stage });
        await logAction('changeStage', selected, previousState, { newStage: stage });
        showToast(`${selected.length} leads → ${stage}`, 'success');
        loadLeads();
      }}
    ]);
    return;
  }

  if (action === 'changeRating') {
    let html = '<div class="form-group"><label>Select new rating</label><select id="bulk-rating"><option value="">Choose...</option>';
    ['Hot','Warm','Cold'].forEach(r => { html += `<option value="${r}">${r}</option>`; });
    html += '</select></div>';
    openModal('Change Rating', html, [
      { id: 'do-rating', label: 'Apply', class: 'btn--primary', onClick: async () => {
        const rating = document.getElementById('bulk-rating').value;
        if (!rating) return showToast('Select a rating', 'error');
        await bulkUpdate('leads', selected, { rating });
        await logAction('changeRating', selected, previousState, { newRating: rating });
        showToast(`${selected.length} leads → ${rating}`, 'success');
        loadLeads();
      }}
    ]);
    return;
  }

  if (action === 'changeSource') {
    let html = '<div class="form-group"><label>Select new source</label><select id="bulk-source"><option value="">Choose...</option>';
    SOURCES.forEach(s => { html += `<option value="${s}">${s}</option>`; });
    html += '</select></div>';
    openModal('Change Source', html, [
      { id: 'do-source', label: 'Apply', class: 'btn--primary', onClick: async () => {
        const source = document.getElementById('bulk-source').value;
        if (!source) return showToast('Select a source', 'error');
        await bulkUpdate('leads', selected, { source });
        await logAction('changeSource', selected, previousState, { newSource: source });
        showToast(`${selected.length} leads → ${source}`, 'success');
        loadLeads();
      }}
    ]);
    return;
  }

  if (action === 'changeWallet') {
    openModal('Change Wallet', '<div class="form-group"><label>Budget / Wallet (EGP)</label><input type="number" id="bulk-wallet" placeholder="e.g. 500000"></div>', [
      { id: 'do-wallet', label: 'Apply', class: 'btn--primary', onClick: async () => {
        const wallet = parseInt(document.getElementById('bulk-wallet').value) || 0;
        if (wallet <= 0) return showToast('Enter a valid amount', 'error');
        await bulkUpdate('leads', selected, { wallet });
        await logAction('changeWallet', selected, previousState, { wallet });
        showToast(`Wallet set to ${wallet.toLocaleString()} for ${selected.length} leads`, 'success');
        loadLeads();
      }}
    ]);
    return;
  }

  if (action === 'addTag') {
    const existingTags = new Set();
    allLeads.forEach(l => (l.tags || []).forEach(t => existingTags.add(t)));
    let tagsHtml = '';
    if (existingTags.size > 0) {
      tagsHtml = '<div style="margin-bottom:8px;display:flex;flex-wrap:wrap;gap:4px">';
      [...existingTags].forEach(t => {
        tagsHtml += `<span class="badge" style="background:#f0f0f0;cursor:pointer;font-size:12px;padding:3px 8px;border-radius:4px" data-existing-tag="${t}">${t}</span>`;
      });
      tagsHtml += '</div>';
    }
    openModal('Add Tag', `<div class="form-group"><label>Tag name</label><input type="text" id="bulk-tag-input" placeholder="e.g. vip, priority"></div>${tagsHtml}`, [
      { id: 'do-tag', label: 'Add', class: 'btn--primary', onClick: async () => {
        const tag = document.getElementById('bulk-tag-input').value.trim();
        if (!tag) return showToast('Enter a tag', 'error');
        updateProgress(0, selected.length);
        for (let i = 0; i < selected.length; i++) {
          const lead = allLeads.find(l => l.id === selected[i]);
          if (lead) {
            const tags = [...(lead.tags || [])];
            if (!tags.includes(tag)) tags.push(tag);
            await update('leads', selected[i], { tags });
          }
          updateProgress(i + 1, selected.length);
        }
        await logAction('addTag', selected, previousState, { tag });
        hideProgress();
        showToast(`Tag "${tag}" added to ${selected.length} leads`, 'success');
        loadLeads();
      }}
    ]);

    document.querySelectorAll('[data-existing-tag]').forEach(el => {
      el.addEventListener('click', () => {
        document.getElementById('bulk-tag-input').value = el.dataset.existingTag;
      });
    });
    return;
  }

  if (action === 'removeTag') {
    const existingTags = new Set();
    allLeads.forEach(l => (l.tags || []).forEach(t => existingTags.add(t)));
    if (existingTags.size === 0) return showToast('No tags found', 'error');
    let tagsHtml = '<div style="display:flex;flex-wrap:wrap;gap:4px">';
    [...existingTags].forEach(t => {
      tagsHtml += `<span class="badge" style="background:#f0f0f0;cursor:pointer;font-size:12px;padding:3px 8px;border-radius:4px;border:2px solid transparent" data-rm-tag="${t}">${t} ✕</span>`;
    });
    tagsHtml += '</div>';
    openModal('Remove Tag', `<div class="form-group"><label>Select tag to remove</label><select id="bulk-rm-tag"><option value="">Choose...</option>`;
    [...existingTags].forEach(t => { tagsHtml = tagsHtml; }); // placeholder
    let selectHtml = '<div class="form-group"><label>Select tag to remove</label><select id="bulk-rm-tag"><option value="">Choose...</option>';
    [...existingTags].forEach(t => { selectHtml += `<option value="${t}">${t}</option>`; });
    selectHtml += '</select></div>';
    openModal('Remove Tag', selectHtml, [
      { id: 'do-rm-tag', label: 'Remove', class: 'btn--danger', onClick: async () => {
        const tag = document.getElementById('bulk-rm-tag').value;
        if (!tag) return showToast('Select a tag', 'error');
        updateProgress(0, selected.length);
        for (let i = 0; i < selected.length; i++) {
          const lead = allLeads.find(l => l.id === selected[i]);
          if (lead) {
            const tags = (lead.tags || []).filter(t => t !== tag);
            await update('leads', selected[i], { tags });
          }
          updateProgress(i + 1, selected.length);
        }
        await logAction('removeTag', selected, previousState, { tag });
        hideProgress();
        showToast(`Tag "${tag}" removed from ${selected.length} leads`, 'success');
        loadLeads();
      }}
    ]);
    return;
  }

  if (action === 'addTask') {
    openModal('Add Task', `<div class="form-group"><label>Task title</label><input type="text" id="bulk-task-title" placeholder="Follow up call"></div>
      <div class="form-group"><label>Due date</label><input type="date" id="bulk-task-due"></div>
      <div class="form-group"><label>Priority</label><select id="bulk-task-priority"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
      <div class="form-group"><label>Notes</label><textarea id="bulk-task-notes" rows="2" placeholder="Additional details..."></textarea></div>`, [
      { id: 'do-task', label: 'Create Tasks', class: 'btn--primary', onClick: async () => {
        const title = document.getElementById('bulk-task-title').value.trim();
        const due = document.getElementById('bulk-task-due').value;
        const priority = document.getElementById('bulk-task-priority').value;
        const notes = document.getElementById('bulk-task-notes').value.trim();
        if (!title) return showToast('Enter a task title', 'error');
        updateProgress(0, selected.length);
        for (let i = 0; i < selected.length; i++) {
          const lead = allLeads.find(l => l.id === selected[i]);
          if (lead) {
            const tasks = [...(lead.tasks || []), { title, due, priority, notes, completed: false, deferred: false, createdAt: new Date().toISOString() }];
            await update('leads', selected[i], { tasks });
          }
          updateProgress(i + 1, selected.length);
        }
        await logAction('addTask', selected, previousState, { title, due, priority });
        hideProgress();
        showToast(`Task "${title}" added to ${selected.length} leads`, 'success');
        loadLeads();
      }}
    ]);
    return;
  }

  if (action === 'nudge') {
    updateProgress(0, selected.length);
    for (let i = 0; i < selected.length; i++) {
      const lead = allLeads.find(l => l.id === selected[i]);
      if (lead) {
        const nudge = { type: 'nudge', urgent: true, message: `URGENT: Follow-up reminder for ${lead.name}`, createdAt: new Date().toISOString() };
        const nudges = [...(lead.nudges || []), nudge];
        await update('leads', selected[i], { nudges, lastNudgeAt: new Date().toISOString() });
      }
      updateProgress(i + 1, selected.length);
    }
    await logAction('nudge', selected, previousState, { count: selected.length, urgent: true });
    hideProgress();
    showToast(`🚨 Urgent nudge sent to ${selected.length} leads`, 'success');
    loadLeads();
    return;
  }

  if (action === 'addToCampaign') {
    const campaigns = await getAll('campaigns');
    let html = '<div class="form-group"><label>Select campaign</label><select id="bulk-campaign"><option value="">Choose...</option>';
    campaigns.forEach(c => { html += `<option value="${c.id}">${c.name}</option>`; });
    html += '</select></div>';
    html += '<div style="border-top:1px solid #eee;padding-top:12px;margin-top:8px"><strong style="font-size:12px">Or create new:</strong></div>';
    html += '<div class="form-group"><label>New campaign name</label><input type="text" id="bulk-new-campaign" placeholder="Campaign name"></div>';
    html += '<div class="form-group"><label>Campaign type</label><select id="bulk-campaign-type"><option value="Email">Email</option><option value="SMS">SMS</option><option value="Social">Social</option><option value="Other">Other</option></select></div>';

    openModal('Add to Campaign', html, [
      { id: 'do-campaign', label: 'Add', class: 'btn--primary', onClick: async () => {
        let campaignId = document.getElementById('bulk-campaign').value;
        const newCampaignName = document.getElementById('bulk-new-campaign').value.trim();
        if (!campaignId && newCampaignName) {
          const type = document.getElementById('bulk-campaign-type').value;
          const newCampaign = await add('campaigns', {
            name: newCampaignName, type, status: 'Active',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '', leadCount: selected.length
          });
          campaignId = newCampaign.id;
        }
        if (!campaignId) return showToast('Select or create a campaign', 'error');
        updateProgress(0, selected.length);
        for (let i = 0; i < selected.length; i++) {
          const lead = allLeads.find(l => l.id === selected[i]);
          if (lead) {
            const leadCampaigns = [...(lead.campaigns || []), campaignId];
            await update('leads', selected[i], { campaigns: leadCampaigns });
          }
          updateProgress(i + 1, selected.length);
        }
        await logAction('addToCampaign', selected, previousState, { campaignId });
        hideProgress();
        showToast(`${selected.length} leads added to campaign`, 'success');
        loadLeads();
      }}
    ]);
    return;
  }

  if (action === 'addBulkNote') {
    openModal('Add Note', '<div class="form-group"><label>Note text</label><textarea id="bulk-note-text" rows="3" placeholder="Enter note..."></textarea></div>', [
      { id: 'do-note', label: 'Add Note', class: 'btn--primary', onClick: async () => {
        const note = document.getElementById('bulk-note-text').value.trim();
        if (!note) return showToast('Enter a note', 'error');
        updateProgress(0, selected.length);
        const bulkNote = `[BULK] ${note}`;
        for (let i = 0; i < selected.length; i++) {
          const lead = allLeads.find(l => l.id === selected[i]);
          if (lead) {
            const existing = lead.note ? lead.note + '\n' : '';
            await update('leads', selected[i], { note: existing + bulkNote });
          }
          updateProgress(i + 1, selected.length);
        }
        await logAction('addBulkNote', selected, previousState, { note: bulkNote });
        hideProgress();
        showToast(`Note added to ${selected.length} leads`, 'success');
        loadLeads();
      }}
    ]);
    return;
  }

  if (action === 'markTodos') {
    updateProgress(0, selected.length);
    for (let i = 0; i < selected.length; i++) {
      const lead = allLeads.find(l => l.id === selected[i]);
      if (lead && lead.tasks) {
        const tasks = lead.tasks.map(t => ({ ...t, completed: true, deferred: false }));
        await update('leads', selected[i], { tasks });
      }
      updateProgress(i + 1, selected.length);
    }
    await logAction('markTodos', selected, previousState, { count: selected.length });
    hideProgress();
    showToast(`All todos marked complete for ${selected.length} leads`, 'success');
    loadLeads();
    return;
  }

  if (action === 'deferTodos') {
    openModal('Defer Todos', '<div class="form-group"><label>Defer until date</label><input type="date" id="bulk-defer-date"></div>', [
      { id: 'do-defer', label: 'Defer', class: 'btn--primary', onClick: async () => {
        const deferUntil = document.getElementById('bulk-defer-date').value;
        if (!deferUntil) return showToast('Select a defer date', 'error');
        updateProgress(0, selected.length);
        for (let i = 0; i < selected.length; i++) {
          const lead = allLeads.find(l => l.id === selected[i]);
          if (lead && lead.tasks) {
            const tasks = lead.tasks.map(t => ({ ...t, deferred: true, deferUntil }));
            await update('leads', selected[i], { tasks });
          }
          updateProgress(i + 1, selected.length);
        }
        await logAction('deferTodos', selected, previousState, { count: selected.length, deferUntil });
        hideProgress();
        showToast(`Tasks deferred until ${deferUntil} for ${selected.length} leads`, 'success');
        loadLeads();
      }}
    ]);
    return;
  }

  if (action === 'mergeLeads') {
    if (selected.length < 2) return showToast('Select at least 2 leads to merge', 'error');
    const primary = allLeads.find(l => l.id === selected[0]);
    const others = selected.slice(1).map(id => allLeads.find(l => l.id === id)).filter(Boolean);

    let html = '<p style="margin-bottom:12px">Select fields to keep from primary lead:</p>';
    html += `<p style="color:#999;font-size:12px;margin-bottom:12px">Primary: <strong>${primary?.name}</strong> (${selected[0]})</p>`;
    const fields = ['name', 'phone', 'email', 'source', 'rating', 'stage', 'assignedTo'];
    fields.forEach(f => {
      const val = primary ? primary[f] : '';
      html += `<div class="form-group"><label><input type="radio" name="merge-${f}" value="primary" checked> Keep ${f}: <strong>${val || '-'}</strong></label>`;
      others.forEach(o => {
        if (o[f]) html += `<label style="margin-left:12px"><input type="radio" name="merge-${f}" value="${o.id}"> Use ${o[f]} (from ${o.name})</label>`;
      });
      html += '</div>';
    });

    openModal('Merge Leads', html, [
      { id: 'do-merge', label: 'Merge', class: 'btn--primary', onClick: async () => {
        const mergedTags = new Set(primary?.tags || []);
        const mergedNote = [primary?.note || ''];
        const mergedTasks = [...(primary?.tasks || [])];
        const mergedNudges = [...(primary?.nudges || [])];

        const updates = {};
        fields.forEach(f => {
          const chosen = document.querySelector(`input[name="merge-${f}"]:checked`);
          if (chosen) {
            if (chosen.value === 'primary') {
              updates[f] = primary[f];
            } else {
              const fromLead = others.find(o => o.id === chosen.value);
              if (fromLead) updates[f] = fromLead[f];
            }
          }
        });

        others.forEach(o => {
          (o.tags || []).forEach(t => mergedTags.add(t));
          if (o.note) mergedNote.push(o.note);
          (o.tasks || []).forEach(t => mergedTasks.push(t));
          (o.nudges || []).forEach(n => mergedNudges.push(n));
        });

        updates.tags = [...mergedTags];
        updates.note = mergedNote.join('\n---\n');
        updates.tasks = mergedTasks;
        updates.nudges = mergedNudges;

        if (primary) await update('leads', primary.id, updates);
        await bulkDelete('leads', others);
        await logAction('mergeLeads', selected, previousState, { primaryId: primary?.id, mergedCount: others.length });
        showToast(`Merged ${others.length} leads into ${primary?.name}`, 'success');
        loadLeads();
      }}
    ]);
    return;
  }
}

async function logAction(type, leadIds, previousState, details) {
  await logBulkAction({
    id: `BA-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
    actionType: type,
    affectedLeadIds: leadIds,
    performedBy: 'Current User',
    performedAt: new Date().toISOString(),
    details,
    previousState,
    isUndone: false
  });
}

async function showBulkHistory() {
  const history = await getBulkHistory();
  history.sort((a, b) => (b.performedAt || '').localeCompare(a.performedAt || ''));
  const recent = history.slice(0, 50);

  let html = '<div style="max-height:400px;overflow-y:auto">';
  if (recent.length === 0) {
    html += '<p style="color:#999;text-align:center;padding:20px">No bulk actions recorded yet</p>';
  } else {
    html += '<table class="data-table"><thead><tr><th>Time</th><th>Action</th><th>Affected</th><th>User</th><th>Status</th><th></th></tr></thead><tbody>';
    recent.forEach(h => {
      const time = h.performedAt ? new Date(h.performedAt).toLocaleString() : '-';
      const actionLabel = ALL_BULK_ACTIONS.find(a => a.value === h.actionType)?.label || h.actionType;
      const count = h.affectedLeadIds ? h.affectedLeadIds.length : 0;
      const status = h.isUndone
        ? '<span style="color:#999">Undone</span>'
        : '<span style="color:#4CAF50">Done</span>';
      const undoBtn = h.isUndone ? '' : `<button class="btn btn--sm btn--outline" data-undo="${h.id}">Undo</button>`;
      html += `<tr><td style="font-size:12px">${time}</td><td>${actionLabel}</td><td>${count}</td><td>${h.performedBy||'-'}</td><td>${status}</td><td>${undoBtn}</td></tr>`;
    });
    html += '</tbody></table>';
  }
  html += '</div>';

  openModal('Bulk Action History (Last 50)', html, []);

  document.querySelectorAll('[data-undo]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const actionId = btn.dataset.undo;
      const ok = await undoBulkAction(actionId, 'leads');
      if (ok) {
        showToast('Action undone — all leads restored', 'success');
        loadLeads();
        showBulkHistory();
      } else {
        showToast('Could not undo', 'error');
      }
    });
  });
}

function renderTopbar() {
  const actions = document.getElementById('topbar-actions');
  actions.innerHTML = `
    <div style="display:flex;gap:6px;align-items:center">
      <a href="lead-add.html" class="btn btn--primary btn--sm">+ Add Lead</a>
      <a href="lead-bulk-import.html" class="btn btn--outline btn--sm">⬆ Upload</a>
      <div style="position:relative;display:inline-block">
        <button class="btn btn--outline btn--sm" id="export-dropdown-btn">Export ▾</button>
        <div id="export-dropdown" style="display:none;position:absolute;right:0;top:100%;background:#fff;border:1px solid #ddd;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:10;min-width:200px">
          <div class="export-option" data-fmt="csv" style="padding:8px 14px;cursor:pointer;font-size:13px">📄 Export All as CSV</div>
          <div class="export-option" data-fmt="excel" style="padding:8px 14px;cursor:pointer;font-size:13px">📊 Export All as Excel</div>
          <div class="export-option" data-fmt="pdf" style="padding:8px 14px;cursor:pointer;font-size:13px">📑 Export All as PDF</div>
          <div class="export-option" data-fmt="json" style="padding:8px 14px;cursor:pointer;font-size:13px">{ } Export All as JSON</div>
          <div style="border-top:1px solid #eee;margin:4px 0"></div>
          <div class="export-option" data-fmt="csv-selected" style="padding:8px 14px;cursor:pointer;font-size:13px">📄 Export Selected as CSV</div>
          <div class="export-option" data-fmt="excel-selected" style="padding:8px 14px;cursor:pointer;font-size:13px">📊 Export Selected as Excel</div>
        </div>
      </div>
      <a href="settings.html" class="btn btn--outline btn--sm" title="Settings">⚙️</a>
    </div>
  `;

  const ddBtn = document.getElementById('export-dropdown-btn');
  const dd = document.getElementById('export-dropdown');
  ddBtn.addEventListener('click', (e) => { e.stopPropagation(); dd.style.display = dd.style.display === 'none' ? 'block' : 'none'; });
  document.addEventListener('click', () => { dd.style.display = 'none'; });

  dd.querySelectorAll('.export-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const fmt = opt.dataset.fmt;
      const isSelectedOnly = fmt.includes('-selected');
      const baseFmt = fmt.replace('-selected', '');
      let data = isSelectedOnly && tableInstance ? tableInstance.getSelected().map(id => allLeads.find(l => l.id === id)).filter(Boolean) : (filteredLeads.length > 0 ? filteredLeads : allLeads);
      if (data.length === 0) return showToast('No data to export', 'error');
      if (baseFmt === 'csv') exportCSV(data, EXPORT_COLUMNS, 'leads.csv');
      if (baseFmt === 'excel') exportExcel(data, EXPORT_COLUMNS, 'leads.xlsx');
      if (baseFmt === 'pdf') exportPDF(data, EXPORT_COLUMNS, 'leads.pdf');
      if (baseFmt === 'json') exportJSON(data, 'leads.json');
      showToast(`Exported ${data.length} leads as ${baseFmt.toUpperCase()}`, 'success');
      dd.style.display = 'none';
    });
  });
}

async function init() {
  await cleanupExpiredTrash();
  renderTopbar();
  renderBulkActions();
  const filterContainer = document.createElement('div');
  document.getElementById('content').appendChild(filterContainer);

  const params = new URLSearchParams(window.location.search);
  const preFilters = {};
  if (params.get('rating')) preFilters.rating = params.get('rating');
  if (params.get('assignFrom')) preFilters.assignFrom = params.get('assignFrom');

  renderFilterBar(filterContainer, { onApply: applyFilters, filters: preFilters });

  const tableContainer = document.createElement('div');
  tableContainer.id = 'leads-table';
  document.getElementById('content').appendChild(tableContainer);

  await loadLeads();
  window.addEventListener('crm:leads:updated', () => loadLeads());
}

init();
