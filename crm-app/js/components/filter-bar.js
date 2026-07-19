// filter-bar.js — Advanced filters: search (name/phone/ID), rating, stage, source, agent, assignFrom, date range toggle
import { SOURCES, RATINGS, STAGES, AGENTS } from '../data/constants.js';

export function renderFilterBar(container, { onApply, filters = {} }) {
  const s = {
    search: filters.search || '',
    rating: filters.rating || '',
    stage: filters.stage || '',
    source: filters.source || '',
    assignedTo: filters.assignedTo || '',
    assignFrom: filters.assignFrom || '',
    dateField: filters.dateField || 'createdDate',
    dateMode: filters.dateMode || 'single',
    dateFrom: filters.dateFrom || '',
    dateTo: filters.dateTo || '',
    datePreset: filters.datePreset || ''
  };

  function render() {
    let html = '<div class="filter-bar">';
    html += `<div class="form-group" style="min-width:200px"><label>Search (Name / Phone / ID)</label><input type="text" id="fb-search" placeholder="LD-000xxx, name, or phone..." value="${s.search}"></div>`;
    html += `<div class="form-group"><label>Rating</label><select id="fb-rating"><option value="">All</option>`;
    RATINGS.forEach(r => { html += `<option value="${r}" ${s.rating === r ? 'selected' : ''}>${r}</option>`; });
    html += '</select></div>';
    html += `<div class="form-group"><label>Stage</label><select id="fb-stage"><option value="">All</option>`;
    STAGES.forEach(st => { html += `<option value="${st}" ${s.stage === st ? 'selected' : ''}>${st}</option>`; });
    html += '</select></div>';
    html += `<div class="form-group"><label>Source</label><select id="fb-source"><option value="">All</option>`;
    SOURCES.forEach(src => { html += `<option value="${src}" ${s.source === src ? 'selected' : ''}>${src}</option>`; });
    html += '</select></div>';
    html += `<div class="form-group"><label>Assigned To</label><select id="fb-assignedTo"><option value="">All</option>`;
    AGENTS.forEach(a => { html += `<option value="${a.id}" ${s.assignedTo === a.id ? 'selected' : ''}>${a.name}</option>`; });
    html += '</select></div>';
    html += `<div class="form-group"><label>Assign From</label><select id="fb-assignFrom"><option value="">All</option>`;
    AGENTS.forEach(a => { html += `<option value="${a.id}" ${s.assignFrom === a.id ? 'selected' : ''}>${a.name}</option>`; });
    html += '</select></div>';
    html += '</div>';

    html += '<div class="filter-bar" style="margin-top:8px">';
    html += `<div class="form-group"><label>Date Field</label><select id="fb-dateField">
      <option value="createdDate" ${s.dateField==='createdDate'?'selected':''}>Created</option>
      <option value="activityDate" ${s.dateField==='activityDate'?'selected':''}>Activity</option>
      <option value="assignmentDate" ${s.dateField==='assignmentDate'?'selected':''}>Assignment</option>
    </select></div>`;
    html += `<div class="form-group"><label>Date Mode</label><select id="fb-dateMode">
      <option value="single" ${s.dateMode==='single'?'selected':''}>Single Date</option>
      <option value="range" ${s.dateMode==='range'?'selected':''}>Date Range</option>
    </select></div>`;
    html += `<div class="form-group" id="fb-single-date-wrap"><label>Date</label><input type="date" id="fb-dateSingle" value="${s.dateFrom}"></div>`;
    html += `<div class="form-group" id="fb-range-date-wrap" style="display:none"><label>From</label><input type="date" id="fb-dateFrom" value="${s.dateFrom}"></div>`;
    html += `<div class="form-group" id="fb-range-date-end" style="display:none"><label>To</label><input type="date" id="fb-dateTo" value="${s.dateTo}"></div>`;
    html += `<div class="form-group"><label>Quick</label><select id="fb-datePreset">
      <option value="">None</option>
      <option value="today" ${s.datePreset==='today'?'selected':''}>Today</option>
      <option value="week" ${s.datePreset==='week'?'selected':''}>Last 7 Days</option>
      <option value="month" ${s.datePreset==='month'?'selected':''}>This Month</option>
      <option value="quarter" ${s.datePreset==='quarter'?'selected':''}>This Quarter</option>
    </select></div>`;
    html += `<div class="form-group" style="align-self:flex-end"><button class="btn btn--primary" id="fb-apply">Apply</button></div>`;
    html += '<div style="flex:1"></div>';
    html += '</div>';
    container.innerHTML = html;

    const dateModeSelect = container.querySelector('#fb-dateMode');
    const singleWrap = container.querySelector('#fb-single-date-wrap');
    const rangeFrom = container.querySelector('#fb-range-date-wrap');
    const rangeTo = container.querySelector('#fb-range-date-end');

    function toggleDateInputs() {
      const isRange = dateModeSelect.value === 'range';
      singleWrap.style.display = isRange ? 'none' : '';
      rangeFrom.style.display = isRange ? '' : 'none';
      rangeTo.style.display = isRange ? '' : 'none';
    }
    dateModeSelect.addEventListener('change', toggleDateInputs);
    toggleDateInputs();

    container.querySelector('#fb-apply').addEventListener('click', () => {
      s.search = container.querySelector('#fb-search').value.trim();
      s.rating = container.querySelector('#fb-rating').value;
      s.stage = container.querySelector('#fb-stage').value;
      s.source = container.querySelector('#fb-source').value;
      s.assignedTo = container.querySelector('#fb-assignedTo').value;
      s.assignFrom = container.querySelector('#fb-assignFrom').value;
      s.dateField = container.querySelector('#fb-dateField').value;
      s.dateMode = container.querySelector('#fb-dateMode').value;
      s.datePreset = container.querySelector('#fb-datePreset').value;

      if (s.dateMode === 'single') {
        s.dateFrom = container.querySelector('#fb-dateSingle').value;
        s.dateTo = '';
      } else {
        s.dateFrom = container.querySelector('#fb-dateFrom').value;
        s.dateTo = container.querySelector('#fb-dateTo').value;
      }

      if (s.datePreset) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        if (s.datePreset === 'today') {
          s.dateFrom = today;
          s.dateTo = today;
        } else if (s.datePreset === 'week') {
          const weekAgo = new Date(now - 7 * 86400000).toISOString().split('T')[0];
          s.dateFrom = weekAgo;
          s.dateTo = today;
        } else if (s.datePreset === 'month') {
          s.dateFrom = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
          s.dateTo = today;
        } else if (s.datePreset === 'quarter') {
          const qStart = Math.floor(now.getMonth() / 3) * 3;
          s.dateFrom = now.getFullYear() + '-' + String(qStart + 1).padStart(2, '0') + '-01';
          s.dateTo = today;
        }
      }

      if (onApply) onApply({ ...s });
    });

    container.querySelector('#fb-search').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') container.querySelector('#fb-apply').click();
    });
  }

  render();

  return {
    getFilters: () => ({ ...s }),
    setFilters: (newFilters) => { Object.assign(s, newFilters); render(); },
    refresh: () => render()
  };
}

export function applyLeadFilters(leads, filters) {
  let result = leads;
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(l =>
      (l.id && l.id.toLowerCase().includes(q)) ||
      (l.name && l.name.toLowerCase().includes(q)) ||
      (l.phone && l.phone.includes(q))
    );
  }
  if (filters.rating) result = result.filter(l => l.rating === filters.rating);
  if (filters.stage) result = result.filter(l => l.stage === filters.stage);
  if (filters.source) result = result.filter(l => l.source === filters.source);
  if (filters.assignedTo) result = result.filter(l => l.assignedTo === filters.assignedTo);
  if (filters.assignFrom) {
    result = result.filter(l => l.assignedTo === filters.assignFrom);
  }
  const dateField = filters.dateField || 'createdDate';
  if (filters.dateFrom && filters.dateTo) {
    result = result.filter(l => {
      const val = l[dateField];
      if (!val) return false;
      return val >= filters.dateFrom && val <= filters.dateTo;
    });
  } else if (filters.dateFrom) {
    result = result.filter(l => {
      const val = l[dateField];
      if (!val) return false;
      return val >= filters.dateFrom;
    });
  }
  return result;
}
