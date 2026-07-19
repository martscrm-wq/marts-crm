// lead-detail.js — T112: Single lead view (REQ-201 detail)
import { getById, update } from '../data/store.js';
import { AGENTS, STAGES, RATINGS, SOURCES } from '../data/constants.js';
import { showToast } from '../components/toast.js';
import { formatDate } from '../utils/format.js';

const container = document.getElementById('content');
const params = new URLSearchParams(window.location.search);
const leadId = params.get('id');

if (!leadId) {
  container.innerHTML = '<div class="empty-state"><p>No lead ID provided</p></div>';
} else {
  init();
}

async function init() {
  const lead = await getById('leads', leadId);
  if (!lead) {
    container.innerHTML = '<div class="empty-state"><p>Lead not found</p></div>';
    return;
  }

  const agent = AGENTS.find(a => a.id === lead.assignedTo);

  let html = '<div class="card" style="max-width:700px">';
  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">`;
  html += `<div><h2 style="margin:0">${lead.name}</h2><p style="color:#999;font-size:13px;margin-top:4px">${lead.id}</p></div>`;
  html += `<div style="display:flex;gap:8px"><a href="leads.html" class="btn">← Back</a><button class="btn btn--primary" id="edit-toggle">Edit</button></div>`;
  html += '</div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">';
  html += `<div><label style="font-size:12px;color:#999">Phone</label><p style="font-weight:600">${lead.phone || '-'}</p></div>`;
  html += `<div><label style="font-size:12px;color:#999">Email</label><p style="font-weight:600">${lead.email || '-'}</p></div>`;
  html += `<div><label style="font-size:12px;color:#999">Rating</label><p><span class="badge badge--${(lead.rating||'').toLowerCase()}">${lead.rating || '-'}</span></p></div>`;
  html += `<div><label style="font-size:12px;color:#999">Stage</label><p style="font-weight:600">${lead.stage || '-'}</p></div>`;
  html += `<div><label style="font-size:12px;color:#999">Source</label><p style="font-weight:600">${lead.source || '-'}</p></div>`;
  html += `<div><label style="font-size:12px;color:#999">Assigned To</label><p style="font-weight:600">${agent ? agent.name : lead.assignedTo || '-'}</p></div>`;
  html += `<div><label style="font-size:12px;color:#999">Created Date</label><p style="font-weight:600">${formatDate(lead.createdDate)}</p></div>`;
  html += `<div><label style="font-size:12px;color:#999">Activity Date</label><p style="font-weight:600">${formatDate(lead.activityDate)}</p></div>`;
  html += `<div><label style="font-size:12px;color:#999">Assignment Date</label><p style="font-weight:600">${formatDate(lead.assignmentDate)}</p></div>`;
  html += `<div><label style="font-size:12px;color:#999">Tags</label><p style="font-weight:600">${(lead.tags || []).join(', ') || '-'}</p></div>`;
  html += '</div>';

  if (lead.note) {
    html += `<div style="margin-top:16px"><label style="font-size:12px;color:#999">Note</label><p>${lead.note}</p></div>`;
  }
  html += '</div>';

  container.innerHTML = html;

  document.getElementById('edit-toggle').addEventListener('click', () => renderEditForm(lead));
}

function renderEditForm(lead) {
  let html = '<div class="card" style="max-width:700px">';
  html += '<h2 style="margin-bottom:20px">Edit Lead</h2>';
  html += '<form id="edit-form">';
  html += `<div class="form-group"><label>Name</label><input type="text" id="e-name" value="${lead.name}"></div>`;
  html += `<div class="form-group"><label>Phone</label><input type="tel" id="e-phone" value="${lead.phone || ''}"></div>`;
  html += `<div class="form-group"><label>Email</label><input type="email" id="e-email" value="${lead.email || ''}"></div>`;

  html += '<div class="form-group"><label>Rating</label><select id="e-rating">';
  RATINGS.forEach(r => { html += `<option value="${r}" ${lead.rating===r?'selected':''}>${r}</option>`; });
  html += '</select></div>';

  html += '<div class="form-group"><label>Stage</label><select id="e-stage">';
  STAGES.forEach(s => { html += `<option value="${s}" ${lead.stage===s?'selected':''}>${s}</option>`; });
  html += '</select></div>';

  html += '<div class="form-group"><label>Source</label><select id="e-source">';
  SOURCES.forEach(s => { html += `<option value="${s}" ${lead.source===s?'selected':''}>${s}</option>`; });
  html += '</select></div>';

  html += '<div class="form-group"><label>Assigned To</label><select id="e-assignedTo">';
  AGENTS.forEach(a => { html += `<option value="${a.id}" ${lead.assignedTo===a.id?'selected':''}>${a.name}</option>`; });
  html += '</select></div>';

  html += `<div class="form-group"><label>Created Date</label><input type="date" id="e-createdDate" value="${lead.createdDate || ''}"></div>`;
  html += `<div class="form-group"><label>Activity Date</label><input type="date" id="e-activityDate" value="${lead.activityDate || ''}"></div>`;
  html += `<div class="form-group"><label>Note</label><textarea id="e-note">${lead.note || ''}</textarea></div>`;
  html += `<div class="form-group"><label>Tags (comma separated)</label><input type="text" id="e-tags" value="${(lead.tags||[]).join(', ')}"></div>`;

  html += '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">';
  html += '<button type="button" class="btn" id="edit-cancel">Cancel</button>';
  html += '<button type="submit" class="btn btn--primary">Save Changes</button>';
  html += '</div></form></div>';

  container.innerHTML = html;

  document.getElementById('edit-cancel').addEventListener('click', () => init());

  document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const patch = {
      name: document.getElementById('e-name').value.trim(),
      phone: document.getElementById('e-phone').value.trim(),
      email: document.getElementById('e-email').value.trim(),
      rating: document.getElementById('e-rating').value,
      stage: document.getElementById('e-stage').value,
      source: document.getElementById('e-source').value,
      assignedTo: document.getElementById('e-assignedTo').value,
      createdDate: document.getElementById('e-createdDate').value,
      activityDate: document.getElementById('e-activityDate').value,
      note: document.getElementById('e-note').value.trim(),
      tags: document.getElementById('e-tags').value.split(',').map(t => t.trim()).filter(Boolean)
    };
    await update('leads', lead.id, patch);
    showToast('Lead updated successfully', 'success');
    init();
  });
}
