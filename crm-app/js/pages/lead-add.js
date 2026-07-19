// lead-add.js — T107: Full add form with validation (REQ-201, REQ-204, REQ-203)
import { add, getAll } from '../data/store.js';
import { SOURCES, RATINGS, STAGES, AGENTS } from '../data/constants.js';
import { validateLead } from '../utils/validate.js';
import { showToast } from '../components/toast.js';
import { autoRotateLeads } from './dashboard.js';

const container = document.getElementById('content');

let html = '<div class="card" style="max-width:600px">';
html += '<h2 style="margin-bottom:20px">Add New Lead</h2>';
html += '<form id="lead-form">';

html += '<div class="form-group"><label>Name *</label><input type="text" id="f-name" required placeholder="Enter name"></div>';
html += '<div class="form-group"><label>Phone *</label><input type="tel" id="f-phone" required placeholder="01xxxxxxxxx"></div>';
html += '<div class="form-group"><label>Email</label><input type="email" id="f-email" placeholder="email@example.com"></div>';

html += '<div class="form-group"><label>Source *</label><select id="f-source" required><option value="">Select source...</option>';
SOURCES.forEach(s => { html += `<option value="${s}">${s}</option>`; });
html += '</select></div>';

html += '<div class="form-group"><label>Rating *</label><select id="f-rating" required><option value="">Select rating...</option>';
RATINGS.forEach(r => { html += `<option value="${r}">${r}</option>`; });
html += '</select></div>';

html += '<div class="form-group"><label>Stage *</label><select id="f-stage" required><option value="">Select stage...</option>';
STAGES.forEach(s => { html += `<option value="${s}">${s}</option>`; });
html += '</select></div>';

html += '<div class="form-group"><label>Assigned To</label><select id="f-assignedTo"><option value="">Auto-assign (Rotation)</option>';
AGENTS.forEach(a => { html += `<option value="${a.id}">${a.name}</option>`; });
html += '</select></div>';

html += '<div class="form-group"><label>Created Date *</label><input type="date" id="f-createdDate" required></div>';
html += '<div class="form-group"><label>Activity Date</label><input type="date" id="f-activityDate"></div>';
html += '<div class="form-group"><label>Assignment Date</label><input type="date" id="f-assignmentDate"></div>';
html += '<div class="form-group"><label>Note</label><textarea id="f-note" placeholder="Additional notes..."></textarea></div>';
html += '<div class="form-group"><label>Tags (comma separated)</label><input type="text" id="f-tags" placeholder="vip, priority, new"></div>';

html += '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">';
html += '<a href="leads.html" class="btn">Cancel</a>';
html += '<button type="submit" class="btn btn--primary">Save Lead</button>';
html += '</div>';
html += '</form></div>';

container.innerHTML = html;

// Set today as default for createdDate
document.getElementById('f-createdDate').value = new Date().toISOString().split('T')[0];

document.getElementById('lead-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const lead = {
    name: document.getElementById('f-name').value.trim(),
    phone: document.getElementById('f-phone').value.trim(),
    email: document.getElementById('f-email').value.trim(),
    source: document.getElementById('f-source').value,
    rating: document.getElementById('f-rating').value,
    stage: document.getElementById('f-stage').value,
    assignedTo: document.getElementById('f-assignedTo').value || '',
    createdDate: document.getElementById('f-createdDate').value,
    activityDate: document.getElementById('f-activityDate').value,
    assignmentDate: document.getElementById('f-assignmentDate').value || (document.getElementById('f-assignedTo').value ? new Date().toISOString().split('T')[0] : ''),
    note: document.getElementById('f-note').value.trim(),
    tags: document.getElementById('f-tags').value.split(',').map(t => t.trim()).filter(Boolean)
  };

  const { valid, errors } = validateLead(lead);
  if (!valid) {
    showToast(errors.join('; '), 'error');
    return;
  }

  const saved = await add('leads', lead);

  if (!lead.assignedTo) {
    const allLeads = await getAll('leads');
    await autoRotateLeads(allLeads);
  }
  showToast(`Lead ${saved.id} created successfully`, 'success');
  setTimeout(() => { window.location.href = 'leads.html'; }, 500);
});
