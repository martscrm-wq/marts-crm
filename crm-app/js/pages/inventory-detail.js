// inventory-detail.js — T313, T314, T315: View/Edit/Publish (REQ-704,705,706)
import { getById, update } from '../data/store.js';
import { showToast } from '../components/toast.js';
import { formatCurrency } from '../utils/format.js';

const container = document.getElementById('content');
const params = new URLSearchParams(window.location.search);
const unitId = params.get('id');

if (!unitId) {
  container.innerHTML = '<div class="empty-state"><p>No unit ID</p></div>';
} else {
  init();
}

function generatePublishUrl() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

async function init() {
  const unit = await getById('units', unitId);
  if (!unit) { container.innerHTML = '<div class="empty-state"><p>Unit not found</p></div>'; return; }

  const hasAllRequired = unit.unitType && unit.area && unit.price && unit.location;

  let html = '<div class="card" style="max-width:700px">';
  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">`;
  html += `<div><h2 style="margin:0">${unit.unitType}</h2><p style="color:#999">${unit.id}</p></div>`;
  html += `<div style="display:flex;gap:8px"><a href="inventory.html" class="btn">← Back</a><button class="btn btn--primary" id="edit-btn">Edit</button></div>`;
  html += '</div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">';
  html += `<div><label style="font-size:12px;color:#999">Type</label><p style="font-weight:600">${unit.unitType}</p></div>`;
  html += `<div><label style="font-size:12px;color:#999">Area</label><p style="font-weight:600">${unit.area} m²</p></div>`;
  html += `<div><label style="font-size:12px;color:#999">Price</label><p style="font-weight:600">${formatCurrency(unit.price)}</p></div>`;
  html += `<div><label style="font-size:12px;color:#999">Location</label><p style="font-weight:600">${unit.location}</p></div>`;
  html += `<div><label style="font-size:12px;color:#999">Layout</label><p style="font-weight:600">${unit.layout || '-'}</p></div>`;
  html += `<div><label style="font-size:12px;color:#999">Status</label><p style="font-weight:600;color:${unit.status==='Published'?'#4CAF50':'#999'}">${unit.status}</p></div>`;
  html += '</div>';

  if (unit.description) html += `<div style="margin-top:16px"><label style="font-size:12px;color:#999">Description</label><p>${unit.description}</p></div>`;

  if (unit.images && unit.images.length > 0) {
    html += '<div class="unit-images">';
    unit.images.forEach(img => { html += `<img src="${img}">`; });
    html += '</div>';
  }

  // Publish section (REQ-705, REQ-706)
  if (hasAllRequired) {
    html += '<div style="margin-top:20px;padding:16px;background:#f5f7fa;border-radius:8px">';
    html += '<h3>Publish</h3>';
    if (unit.publishUrl) {
      const pubUrl = `${window.location.origin}/crm-app/public/unit.html?code=${unit.publishUrl}`;
      html += `<p style="margin-top:8px">Public URL: <a href="${pubUrl}" target="_blank" style="color:var(--color-primary)">${pubUrl}</a></p>`;
      html += `<button class="btn btn--sm" style="margin-top:8px" onclick="navigator.clipboard.writeText('${pubUrl}');document.getElementById('copy-msg').textContent='Copied!'"><i class="fas fa-copy"></i> Copy URL</button> <span id="copy-msg" style="color:#4CAF50;font-size:12px"></span>`;
    } else {
      html += `<button class="btn btn--primary" id="publish-btn">Generate Public URL</button>`;
    }
    html += '</div>';
  } else {
    html += '<div style="margin-top:16px;padding:12px;background:rgba(255,140,0,0.1);border-radius:8px;color:#FF8C00"><strong>⚠</strong> Complete all required fields (type, area, price, location) to publish.</div>';
  }

  html += '</div>';
  container.innerHTML = html;

  const publishBtn = document.getElementById('publish-btn');
  if (publishBtn) {
    publishBtn.addEventListener('click', async () => {
      const code = generatePublishUrl();
      await update('units', unitId, { publishUrl: code, publishTime: new Date().toISOString(), status: 'Published' });
      showToast('Published! URL generated.', 'success');
      init();
    });
  }

  document.getElementById('edit-btn').addEventListener('click', () => renderEditForm(unit));
}

function renderEditForm(unit) {
  let html = '<div class="card" style="max-width:700px">';
  html += '<h2 style="margin-bottom:20px">Edit Unit</h2>';
  html += '<form id="edit-unit-form">';
  html += `<div class="form-group"><label>Type</label><select id="eu-type"><option>Apartment</option><option>Villa</option><option>Office</option><option>Shop</option><option>Land</option><option>Chalet</option></select></div>`;
  html += `<div class="form-group"><label>Area (m²)</label><input type="number" id="eu-area" value="${unit.area || ''}"></div>`;
  html += `<div class="form-group"><label>Price (EGP)</label><input type="number" id="eu-price" value="${unit.price || ''}"></div>`;
  html += `<div class="form-group"><label>Location</label><input type="text" id="eu-location" value="${unit.location || ''}"></div>`;
  html += `<div class="form-group"><label>Layout</label><input type="text" id="eu-layout" value="${unit.layout || ''}"></div>`;
  html += `<div class="form-group"><label>Description</label><textarea id="eu-desc">${unit.description || ''}</textarea></div>`;
  html += '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">';
  html += '<button type="button" class="btn" id="eu-cancel">Cancel</button>';
  html += '<button type="submit" class="btn btn--primary">Save</button></div></form></div>';

  container.innerHTML = html;
  document.getElementById('eu-type').value = unit.unitType || '';
  document.getElementById('eu-cancel').addEventListener('click', init);
  document.getElementById('edit-unit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await update('units', unitId, {
      unitType: document.getElementById('eu-type').value,
      area: parseFloat(document.getElementById('eu-area').value),
      price: parseFloat(document.getElementById('eu-price').value),
      location: document.getElementById('eu-location').value.trim(),
      layout: document.getElementById('eu-layout').value.trim(),
      description: document.getElementById('eu-desc').value.trim()
    });
    showToast('Unit updated', 'success');
    init();
  });
}
