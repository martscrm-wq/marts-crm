// marketing-add.js — T302: Add campaign form (REQ-602)
import { add } from '../data/store.js';
import { showToast } from '../components/toast.js';

const container = document.getElementById('content');
container.innerHTML = `
<div class="card" style="max-width:600px">
  <h2 style="margin-bottom:20px">New Campaign</h2>
  <form id="campaign-form">
    <div class="form-group"><label>Name *</label><input type="text" id="c-name" required placeholder="Campaign name"></div>
    <div class="form-group"><label>Type *</label><select id="c-type" required>
      <option value="">Select...</option><option>Email</option><option>SMS</option><option>Social Media</option><option>Cold Call</option><option>Event</option>
    </select></div>
    <div class="form-group"><label>Start Date *</label><input type="date" id="c-start" required></div>
    <div class="form-group"><label>End Date *</label><input type="date" id="c-end" required></div>
    <div class="form-group"><label>Target Audience</label><input type="text" id="c-audience" placeholder="e.g., Hot leads"></div>
    <div class="form-group"><label>Status</label><select id="c-status">
      <option value="Draft">Draft</option><option value="Active">Active</option>
    </select></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">
      <a href="marketing.html" class="btn">Cancel</a>
      <button type="submit" class="btn btn--primary">Create Campaign</button>
    </div>
  </form>
</div>`;

document.getElementById('campaign-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const campaign = {
    name: document.getElementById('c-name').value.trim(),
    type: document.getElementById('c-type').value,
    startDate: document.getElementById('c-start').value,
    endDate: document.getElementById('c-end').value,
    targetAudience: document.getElementById('c-audience').value.trim(),
    status: document.getElementById('c-status').value
  };
  if (!campaign.name || !campaign.type) return showToast('Fill required fields', 'error');
  await add('campaigns', campaign);
  showToast('Campaign created', 'success');
  window.location.href = 'marketing.html';
});
