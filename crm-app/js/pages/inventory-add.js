// inventory-add.js — T312: Add unit form (REQ-709)
import { add } from '../data/store.js';
import { showToast } from '../components/toast.js';

const container = document.getElementById('content');
container.innerHTML = `
<div class="card" style="max-width:700px">
  <h2 style="margin-bottom:20px">Add New Unit</h2>
  <form id="unit-form">
    <div class="form-group"><label>Unit Type *</label><select id="u-type" required>
      <option value="">Select...</option><option>Apartment</option><option>Villa</option><option>Office</option><option>Shop</option><option>Land</option><option>Chalet</option>
    </select></div>
    <div class="form-group"><label>Area (m²) *</label><input type="number" id="u-area" required placeholder="150"></div>
    <div class="form-group"><label>Price (EGP) *</label><input type="number" id="u-price" required placeholder="500000"></div>
    <div class="form-group"><label>Location *</label><input type="text" id="u-location" required placeholder="e.g., New Cairo"></div>
    <div class="form-group"><label>Layout</label><input type="text" id="u-layout" placeholder="3BR, 2BA"></div>
    <div class="form-group"><label>Description</label><textarea id="u-desc" placeholder="Unit description..."></textarea></div>
    <div class="form-group"><label>Images</label><input type="file" id="u-images" multiple accept="image/*"></div>
    <div id="u-images-preview" class="unit-images"></div>
    <div style="border-top:1px solid var(--color-border);padding-top:16px;margin-top:16px">
      <h3 style="margin-bottom:12px">Publish Settings</h3>
      <div class="form-group"><label>Schedule Publish Time (optional)</label><input type="datetime-local" id="u-publishTime"></div>
      <p style="color:#999;font-size:12px">If set, the unit will be published automatically at this time. Otherwise, you can publish manually from the unit detail page.</p>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">
      <a href="inventory.html" class="btn">Cancel</a>
      <button type="submit" class="btn btn--primary">Save Unit</button>
    </div>
  </form>
</div>`;

// Image preview
document.getElementById('u-images').addEventListener('change', (e) => {
  const preview = document.getElementById('u-images-preview');
  preview.innerHTML = '';
  [...e.target.files].forEach(f => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.createElement('img');
      img.src = ev.target.result;
      preview.appendChild(img);
    };
    reader.readAsDataURL(f);
  });
});

document.getElementById('unit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const imageFiles = document.getElementById('u-images').files;
  const images = [];
  for (const f of imageFiles) {
    const b64 = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target.result);
      reader.readAsDataURL(f);
    });
    images.push(b64);
  }
  const unit = {
    unitType: document.getElementById('u-type').value,
    area: parseFloat(document.getElementById('u-area').value),
    price: parseFloat(document.getElementById('u-price').value),
    location: document.getElementById('u-location').value.trim(),
    layout: document.getElementById('u-layout').value.trim(),
    description: document.getElementById('u-desc').value.trim(),
    images,
    status: 'Draft',
    publishTime: document.getElementById('u-publishTime').value || null
  };
  await add('units', unit);
  showToast('Unit created', 'success');
  window.location.href = 'inventory.html';
});
