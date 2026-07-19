// data-table.js — Generic table with sorting, pagination, row selection
// REQ-104, REQ-401

export function renderDataTable(container, { columns, rows, pageSize = 20, onRowClick, onSelectChange, idField = 'id' }) {
  let state = { sortCol: null, sortDir: 'asc', page: 1, selected: new Set() };
  const totalPages = Math.ceil(rows.length / pageSize);

  function getSorted() {
    if (!state.sortCol) return rows;
    const col = columns.find(c => c.key === state.sortCol);
    if (!col) return rows;
    return [...rows].sort((a, b) => {
      const va = col.sortValue ? col.sortValue(a) : a[state.sortCol];
      const vb = col.sortValue ? col.sortValue(b) : b[state.sortCol];
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return state.sortDir === 'asc' ? cmp : -cmp;
    });
  }

  function getPaginated() {
    const sorted = getSorted();
    const start = (state.page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }

  function render() {
    const paginated = getPaginated();
    const allOnPageIds = paginated.map(r => r[idField]);
    const allSelected = allOnPageIds.length > 0 && allOnPageIds.every(id => state.selected.has(id));

    let html = '<div class="table-wrap"><table class="data-table"><thead><tr>';
    html += `<th class="data-table__checkbox"><input type="checkbox" id="dt-select-all" ${allSelected ? 'checked' : ''}></th>`;
    columns.forEach(col => {
      const icon = state.sortCol === col.key ? (state.sortDir === 'asc' ? ' ▲' : ' ▼') : '';
      html += `<th data-col="${col.key}">${col.label}${icon}</th>`;
    });
    html += '</tr></thead><tbody>';

    if (paginated.length === 0) {
      html += `<tr><td colspan="${columns.length + 1}" class="empty-state">No records found</td></tr>`;
    } else {
      paginated.forEach(row => {
        const checked = state.selected.has(row[idField]) ? 'checked' : '';
        html += `<tr data-id="${row[idField]}"><td class="data-table__checkbox"><input type="checkbox" class="dt-row-cb" data-id="${row[idField]}" ${checked}></td>`;
        columns.forEach(col => {
          const val = col.render ? col.render(row) : (row[col.key] ?? '-');
          html += `<td>${val}</td>`;
        });
        html += '</tr>';
      });
    }
    html += '</tbody></table></div>';

    if (totalPages > 1) {
      html += `<div style="display:flex;align-items:center;gap:8px;margin-top:12px;justify-content:space-between">`;
      html += `<span style="font-size:12px;color:#999">Page ${state.page} of ${totalPages} (${rows.length} total)</span>`;
      html += `<div style="display:flex;gap:4px">`;
      html += `<button class="btn btn--sm" data-page="prev" ${state.page === 1 ? 'disabled' : ''}>← Prev</button>`;
      html += `<button class="btn btn--sm" data-page="next" ${state.page === totalPages ? 'disabled' : ''}>Next →</button>`;
      html += '</div></div>';
    }

    container.innerHTML = html;
    bindEvents();
  }

  function bindEvents() {
    container.querySelectorAll('th[data-col]').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.col;
        if (state.sortCol === col) {
          state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortCol = col;
          state.sortDir = 'asc';
        }
        render();
      });
    });

    const selectAll = container.querySelector('#dt-select-all');
    if (selectAll) {
      selectAll.addEventListener('change', () => {
        const paginated = getPaginated();
        paginated.forEach(r => {
          if (selectAll.checked) state.selected.add(r[idField]);
          else state.selected.delete(r[idField]);
        });
        render();
        if (onSelectChange) onSelectChange([...state.selected]);
      });
    }

    container.querySelectorAll('.dt-row-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) state.selected.add(cb.dataset.id);
        else state.selected.delete(cb.dataset.id);
        render();
        if (onSelectChange) onSelectChange([...state.selected]);
      });
    });

    container.querySelectorAll('tr[data-id]').forEach(tr => {
      if (!tr.querySelector('input[type="checkbox"]')) return;
      tr.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.closest('td.data-table__checkbox')) return;
        if (onRowClick) onRowClick(tr.dataset.id);
      });
      tr.style.cursor = 'pointer';
    });

    container.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.page === 'prev' && state.page > 1) { state.page--; render(); }
        if (btn.dataset.page === 'next' && state.page < totalPages) { state.page++; render(); }
      });
    });
  }

  render();

  return {
    getSelected: () => [...state.selected],
    clearSelection: () => { state.selected.clear(); render(); },
    setSelected: (ids) => { state.selected = new Set(ids); render(); },
    setPage: (p) => { state.page = p; render(); },
    refresh: (newRows) => { rows = newRows; state.page = 1; state.selected.clear(); render(); },
    reset: () => { state = { sortCol: null, sortDir: 'asc', page: 1, selected: new Set() }; render(); }
  };
}
