// lead-bulk-import.js — Excel/CSV import with preview + validation + Excel template
import { getAll, add } from '../data/store.js';
import { generateId } from '../utils/id-generator.js';
import { SOURCES, RATINGS, STAGES, AGENTS, CSV_COLUMNS } from '../data/constants.js';
import { showToast } from '../components/toast.js';

const container = document.getElementById('content');
let parsedRows = [];

container.innerHTML = `
<div class="card" style="max-width:900px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
    <h2>Bulk Import Leads</h2>
    <div style="display:flex;gap:8px">
      <button class="btn btn--outline" id="download-template">⬇ Download Excel Template</button>
      <button class="btn btn--outline" id="download-csv-template">⬇ Download CSV Template</button>
      <a href="leads.html" class="btn">← Back</a>
    </div>
  </div>
  <div class="form-group"><label>Upload CSV or Excel file</label><input type="file" id="import-file" accept=".csv,.xlsx,.xls"></div>
  <div id="preview-area"></div>
  <div id="import-actions" style="margin-top:16px;display:none">
    <button class="btn btn--primary" id="confirm-import">Confirm Import</button>
    <span id="import-count" style="margin-left:12px;color:#999"></span>
  </div>
</div>`;

document.getElementById('download-template').addEventListener('click', () => {
  const header = CSV_COLUMNS;
  const data = [header, ['John Doe', '01234567890', 'john@email.com', 'Website', 'Warm', 'New', 'AG-001', '2026-01-15', '', '', 'Sample lead', 'vip;priority']];
  if (typeof XLSX !== 'undefined') {
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, 'leads-template.xlsx');
  } else {
    const csv = header.join(',') + '\n' + data[1].join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leads-template.csv';
    a.click();
  }
});

document.getElementById('download-csv-template').addEventListener('click', () => {
  const header = CSV_COLUMNS.join(',');
  const example = ['John Doe', '01234567890', 'john@email.com', 'Website', 'Warm', 'New', 'AG-001', '2026-01-15', '', '', 'Sample lead', 'vip;priority'].join(',');
  const blob = new Blob([header + '\n' + example + '\n'], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leads-template.csv';
  a.click();
});

document.getElementById('import-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof XLSX === 'undefined') {
        showToast('Excel library not loaded. Please upload CSV instead.', 'error');
        return;
      }
      const wb = XLSX.read(ev.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const csv = XLSX.utils.sheet_to_csv(ws);
      parseCSV(csv);
    };
    reader.readAsArrayBuffer(file);
  } else {
    const reader = new FileReader();
    reader.onload = (ev) => { parseCSV(ev.target.result); };
    reader.readAsText(file);
  }
});

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) { showToast('File is empty', 'error'); return; }
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  parsedRows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',');
    const row = { _lineNum: i + 1, _errors: [] };
    CSV_COLUMNS.forEach((col, idx) => {
      row[col] = (vals[idx] || '').trim();
    });
    // Validate
    if (!row.name) row._errors.push('Name required');
    if (!row.phone || !/^[+]?[0-9]{7,15}$/.test(row.phone)) row._errors.push('Invalid phone');
    if (row.source && !SOURCES.includes(row.source)) row._errors.push('Invalid source');
    if (row.rating && !RATINGS.includes(row.rating)) row._errors.push('Invalid rating');
    if (row.stage && !STAGES.includes(row.stage)) row._errors.push('Invalid stage');
    parsedRows.push(row);
  }
  renderPreview();
}

function renderPreview() {
  const area = document.getElementById('preview-area');
  const actions = document.getElementById('import-actions');
  const valid = parsedRows.filter(r => r._errors.length === 0);
  const invalid = parsedRows.filter(r => r._errors.length > 0);

  let html = `<p style="margin-bottom:12px"><strong>${valid.length}</strong> valid rows, <strong style="color:#F44336">${invalid.length}</strong> invalid rows</p>`;
  html += '<div class="table-wrap"><table class="data-table"><thead><tr><th>Line</th><th>Name</th><th>Phone</th><th>Source</th><th>Rating</th><th>Stage</th><th>Status</th></tr></thead><tbody>';
  parsedRows.forEach(r => {
    const color = r._errors.length > 0 ? 'rgba(244,67,54,0.05)' : '';
    const status = r._errors.length > 0 ? `<span style="color:#F44336;font-size:12px">${r._errors.join('; ')}</span>` : '<span style="color:#4CAF50">✓ OK</span>';
    html += `<tr style="background:${color}"><td>${r._lineNum}</td><td>${r.name}</td><td>${r.phone}</td><td>${r.source}</td><td>${r.rating}</td><td>${r.stage}</td><td>${status}</td></tr>`;
  });
  html += '</tbody></table></div>';
  area.innerHTML = html;

  if (valid.length > 0) {
    actions.style.display = 'block';
    document.getElementById('import-count').textContent = `${valid.length} leads will be imported`;
  }
}

document.getElementById('confirm-import').addEventListener('click', async () => {
  const valid = parsedRows.filter(r => r._errors.length === 0);
  for (const row of valid) {
    await add('leads', {
      name: row.name,
      phone: row.phone,
      email: row.email || '',
      source: row.source || 'Other',
      rating: row.rating || 'Cold',
      stage: row.stage || 'New',
      assignedTo: row.assignedTo || AGENTS[0].id,
      createdDate: row.createdDate || new Date().toISOString().split('T')[0],
      activityDate: row.activityDate || '',
      assignmentDate: row.assignmentDate || '',
      note: row.note || '',
      tags: row.tags ? row.tags.split(';').map(t => t.trim()) : []
    });
  }
  showToast(`${valid.length} leads imported successfully`, 'success');
  parsedRows = [];
  document.getElementById('preview-area').innerHTML = '';
  document.getElementById('import-actions').style.display = 'none';
});
