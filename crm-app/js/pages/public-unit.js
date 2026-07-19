// public-unit.js — REQ-707, REQ-708: Full public listing page with client form
import { query, add } from '../data/store.js';
import { showToast } from '../components/toast.js';
import { formatCurrency } from '../utils/format.js';

const container = document.getElementById('unit-content');
const params = new URLSearchParams(window.location.search);
const code = params.get('code');

if (!code) {
  container.innerHTML = '<div class="empty-state"><p>No unit code provided</p></div>';
} else {
  loadUnit();
}

async function loadUnit() {
  const units = await query('units', u => u.publishUrl === code);
  if (units.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Unit not found or no longer available</p></div>';
    return;
  }
  const u = units[0];

  let imagesHtml = '';
  if (u.images && u.images.length > 0) {
    imagesHtml = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">';
    u.images.forEach(img => { imagesHtml += `<img src="${img}" style="width:200px;height:150px;object-fit:cover;border-radius:8px">`; });
    imagesHtml += '</div>';
  }

  container.innerHTML = `
    <div style="margin-bottom:24px">
      <h1 style="font-size:28px;margin-bottom:8px">${u.unitType || 'Property'}</h1>
      <p style="color:#666;font-size:14px">${u.location || ''}</p>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
      <div class="card" style="padding:16px"><label style="font-size:12px;color:#999">Price</label><p style="font-size:22px;font-weight:700;color:var(--color-primary)">${formatCurrency(u.price)}</p></div>
      <div class="card" style="padding:16px"><label style="font-size:12px;color:#999">Area</label><p style="font-size:22px;font-weight:700">${u.area} m²</p></div>
      <div class="card" style="padding:16px"><label style="font-size:12px;color:#999">Layout</label><p style="font-weight:600">${u.layout || '-'}</p></div>
      <div class="card" style="padding:16px"><label style="font-size:12px;color:#999">Type</label><p style="font-weight:600">${u.unitType || '-'}</p></div>
    </div>

    ${u.description ? `<div class="card" style="margin-bottom:24px"><h3 style="margin-bottom:8px">Description</h3><p style="color:#666;line-height:1.6">${u.description}</p></div>` : ''}
    ${imagesHtml}

    <div class="card" style="margin-top:32px;max-width:500px">
      <h3 style="margin-bottom:16px">Interested? Leave your details</h3>
      <form id="public-form">
        <div class="form-group"><label>Name *</label><input type="text" id="pf-name" required placeholder="Your full name"></div>
        <div class="form-group"><label>Phone *</label><input type="tel" id="pf-phone" required placeholder="01xxxxxxxxx"></div>
        <div class="form-group"><label>Email</label><input type="email" id="pf-email" placeholder="you@email.com"></div>
        <div class="form-group"><label>Note</label><textarea id="pf-note" placeholder="Any questions or requirements..."></textarea></div>
        <button type="submit" class="btn btn--primary" style="width:100%">Send Inquiry</button>
      </form>
    </div>
  `;

  document.getElementById('public-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('pf-name').value.trim();
    const phone = document.getElementById('pf-phone').value.trim();
    const email = document.getElementById('pf-email').value.trim();
    const note = document.getElementById('pf-note').value.trim();

    if (!name || !phone) return showToast('Name and phone are required', 'error');

    await add('leads', {
      name,
      phone,
      email,
      source: 'Public Listing',
      rating: 'Warm',
      stage: 'New',
      assignedTo: '',
      createdDate: new Date().toISOString().split('T')[0],
      activityDate: '',
      assignmentDate: '',
      note: `Inquiry for ${u.unitType} at ${u.location} (${formatCurrency(u.price)})\n${note}`,
      tags: ['public-inquiry']
    });

    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px">
        <div style="font-size:48px;margin-bottom:16px">✅</div>
        <h2>Thank you, ${name}!</h2>
        <p style="color:#666;margin-top:8px">Your inquiry has been received. We'll contact you soon.</p>
        <p style="color:#999;font-size:13px;margin-top:16px">Reference: ${u.unitType} at ${u.location}</p>
      </div>
    `;
  });
}
