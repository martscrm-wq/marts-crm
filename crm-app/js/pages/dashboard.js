// dashboard.js — Dynamic rating scoring + rotation + stats
import { getAll, update } from '../data/store.js';
import { seedLeads } from '../data/seed.js';
import { AGENTS } from '../data/constants.js';

const SCORING = {
  nudgeWeight: 5,
  taskWeight: 3,
  completedTaskWeight: 5,
  recencyBonusDays: 7,
  recencyBonus: 10,
  stalePenaltyDays: 30,
  stalePenalty: -15
};

export function calculateLeadScore(lead) {
  let score = 50;
  const nudges = lead.nudges || [];
  score += nudges.length * SCORING.nudgeWeight;
  const tasks = lead.tasks || [];
  tasks.forEach(t => {
    score += t.completed ? SCORING.completedTaskWeight : SCORING.taskWeight;
  });
  if (lead.activityDate) {
    const daysSince = Math.floor((Date.now() - new Date(lead.activityDate).getTime()) / 86400000);
    if (daysSince <= SCORING.recencyBonusDays) score += SCORING.recencyBonus;
    if (daysSince >= SCORING.stalePenaltyDays) score += SCORING.stalePenalty;
  }
  if (nudges.length > 0) {
    const lastNudge = new Date(nudges[nudges.length - 1].createdAt);
    const daysSinceNudge = Math.floor((Date.now() - lastNudge.getTime()) / 86400000);
    if (daysSinceNudge <= 3) score += 8;
  }
  return Math.max(0, Math.min(100, score));
}

export function scoreToRating(score) {
  if (score >= 70) return 'Hot';
  if (score >= 30) return 'Warm';
  return 'Cold';
}

export async function autoRotateLeads(leads) {
  const unassigned = leads.filter(l => !l.assignedTo);
  if (unassigned.length === 0) return 0;
  const agentCounts = {};
  AGENTS.forEach(a => { agentCounts[a.id] = 0; });
  leads.filter(l => l.assignedTo).forEach(l => {
    if (agentCounts[l.assignedTo] !== undefined) agentCounts[l.assignedTo]++;
  });
  let rotated = 0;
  for (const lead of unassigned) {
    const sorted = Object.entries(agentCounts).sort((a, b) => a[1] - b[1]);
    const bestAgent = sorted[0][0];
    await update('leads', lead.id, { assignedTo: bestAgent, assignmentDate: new Date().toISOString().split('T')[0] });
    agentCounts[bestAgent]++;
    rotated++;
  }
  return rotated;
}

async function init() {
  let leads = await getAll('leads');
  if (leads.length === 0) {
    await seedLeads();
    leads = await getAll('leads');
  }

  let rotated = 0;
  const unassigned = leads.filter(l => !l.assignedTo);
  if (unassigned.length > 0) {
    rotated = await autoRotateLeads(leads);
    leads = await getAll('leads');
  }

  const updatedCount = await recalculateRatings(leads);
  if (updatedCount > 0) {
    leads = await getAll('leads');
  }

  renderDashboard(leads, rotated, updatedCount);

  window.addEventListener('crm:leads:updated', async () => {
    const updated = await getAll('leads');
    await recalculateRatings(updated);
    const fresh = await getAll('leads');
    renderDashboard(fresh, 0, 0);
  });
}

async function recalculateRatings(leads) {
  let count = 0;
  for (const lead of leads) {
    const score = calculateLeadScore(lead);
    const newRating = scoreToRating(score);
    if (lead.rating !== newRating) {
      await update('leads', lead.id, { rating: newRating, ratingScore: score });
      count++;
    } else if (lead.ratingScore !== score) {
      await update('leads', lead.id, { ratingScore: score });
    }
  }
  return count;
}

function renderDashboard(leads, rotated, updatedCount) {
  const container = document.getElementById('content');
  const counts = { Hot: 0, Warm: 0, Cold: 0 };
  leads.forEach(l => { if (counts[l.rating] !== undefined) counts[l.rating]++; });

  const agentCounts = {};
  AGENTS.forEach(a => { agentCounts[a.name] = 0; });
  leads.filter(l => l.assignedTo).forEach(l => {
    const agent = AGENTS.find(a => a.id === l.assignedTo);
    if (agent && agentCounts[agent.name] !== undefined) agentCounts[agent.name]++;
  });

  let agentBars = '';
  const maxAgent = Math.max(...Object.values(agentCounts), 1);
  Object.entries(agentCounts).forEach(([name, count]) => {
    const pct = Math.round((count / maxAgent) * 100);
    agentBars += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="width:120px;font-size:13px;text-align:right">${name}</span>
      <div style="flex:1;height:20px;background:#eee;border-radius:4px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:var(--color-primary);transition:width 0.3s"></div>
      </div>
      <span style="width:30px;font-size:13px;font-weight:600">${count}</span>
    </div>`;
  });

  let notices = '';
  if (rotated > 0) notices += `<div style="padding:8px 12px;background:rgba(33,150,243,0.1);border-radius:6px;margin-bottom:8px;font-size:13px;color:#2196F3">🔄 ${rotated} new lead(s) auto-rotated to agents</div>`;
  if (updatedCount > 0) notices += `<div style="padding:8px 12px;background:rgba(76,175,80,0.1);border-radius:6px;margin-bottom:8px;font-size:13px;color:#4CAF50">🌡 ${updatedCount} lead(s) rating recalculated based on activity</div>`;

  container.innerHTML = `
    ${notices}
    <div class="dashboard-cards">
      <a href="leads.html?rating=Hot" class="dashboard-card dashboard-card--hot">
        <div class="dashboard-card__count">${counts.Hot}</div>
        <div class="dashboard-card__label">Hot Leads</div>
      </a>
      <a href="leads.html?rating=Warm" class="dashboard-card dashboard-card--warm">
        <div class="dashboard-card__count">${counts.Warm}</div>
        <div class="dashboard-card__label">Warm Leads</div>
      </a>
      <a href="leads.html?rating=Cold" class="dashboard-card dashboard-card--cold">
        <div class="dashboard-card__count">${counts.Cold}</div>
        <div class="dashboard-card__label">Cold Leads</div>
      </a>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px">
      <div class="card">
        <h3>Agent Distribution</h3>
        <div style="margin-top:12px">${agentBars}</div>
      </div>
      <div class="card">
        <h3>Recent Leads</h3>
        <table class="data-table" style="margin-top:12px">
          <thead><tr><th>Code</th><th>Name</th><th>Rating</th><th>Stage</th></tr></thead>
          <tbody>
            ${leads.slice(0, 8).map(l => `
              <tr style="cursor:pointer" onclick="location.href='lead-detail.html?id=${l.id}'">
                <td><strong style="color:var(--color-primary)">${l.id}</strong></td>
                <td>${l.name}</td>
                <td><span class="badge badge--${(l.rating||'').toLowerCase()}">${l.rating||'-'}</span></td>
                <td>${l.stage || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

init();
