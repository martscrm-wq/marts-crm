// deal-insights.js — T224: Charts via canvas (REQ-503)
import { getAll } from '../data/store.js';
import { formatCurrency } from '../utils/format.js';

async function init() {
  document.getElementById('topbar-actions').innerHTML = '<a href="deals.html" class="btn btn--sm">← Back to Deals</a> <a href="settings.html" class="btn btn--outline btn--sm" title="Settings">⚙️</a>';
  const deals = await getAll('deals');
  const container = document.getElementById('content');

  const statusCounts = { Open: 0, Won: 0, Lost: 0 };
  const monthlyValue = {};
  deals.forEach(d => {
    statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
    if (d.createdAt) {
      const month = d.createdAt.substring(0, 7);
      monthlyValue[month] = (monthlyValue[month] || 0) + d.amount;
    }
  });

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div class="card">
        <h3>Deals by Status</h3>
        <canvas id="chart-status" width="400" height="250" style="margin-top:12px"></canvas>
      </div>
      <div class="card">
        <h3>Value by Month</h3>
        <canvas id="chart-monthly" width="400" height="250" style="margin-top:12px"></canvas>
      </div>
    </div>
    <div class="card" style="margin-top:20px">
      <h3>Summary</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:12px">
        <div style="text-align:center"><div style="font-size:28px;font-weight:700;color:#FF8C00">${statusCounts.Open}</div><div style="color:#999">Open</div></div>
        <div style="text-align:center"><div style="font-size:28px;font-weight:700;color:#4CAF50">${statusCounts.Won}</div><div style="color:#999">Won</div></div>
        <div style="text-align:center"><div style="font-size:28px;font-weight:700;color:#F44336">${statusCounts.Lost}</div><div style="color:#999">Lost</div></div>
      </div>
    </div>
  `;

  // Draw bar chart for status
  drawBarChart('chart-status', [
    { label: 'Open', value: statusCounts.Open, color: '#FF8C00' },
    { label: 'Won', value: statusCounts.Won, color: '#4CAF50' },
    { label: 'Lost', value: statusCounts.Lost, color: '#F44336' }
  ]);

  // Draw bar chart for monthly value
  const months = Object.keys(monthlyValue).sort();
  drawBarChart('chart-monthly', months.map(m => ({
    label: m,
    value: monthlyValue[m],
    color: '#2196F3'
  })));
}

function drawBarChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (data.length === 0) {
    ctx.fillStyle = '#999';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data', w / 2, h / 2);
    return;
  }

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.min(60, (w - 80) / data.length);
  const startX = (w - barWidth * data.length) / 2;

  data.forEach((d, i) => {
    const barH = (d.value / maxVal) * (h - 60);
    const x = startX + i * (barWidth + 10);
    const y = h - 30 - barH;
    ctx.fillStyle = d.color;
    ctx.fillRect(x, y, barWidth, barH);
    ctx.fillStyle = '#333';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, x + barWidth / 2, h - 12);
    if (d.value > 0) {
      ctx.fillText(d.value.toLocaleString(), x + barWidth / 2, y - 6);
    }
  });
}

init();
