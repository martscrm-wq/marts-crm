// date-range.js — Reusable date/single toggle component (REQ-202)

export function createDateRange(container, { label, name, onChange } = {}) {
  let mode = 'single'; // 'single' | 'range'
  const wrap = document.createElement('div');
  wrap.className = 'form-group';
  wrap.style.display = 'inline-block';
  wrap.style.minWidth = '180px';

  function render() {
    let html = `<label>${label || name || 'Date'}</label>`;
    html += `<div style="display:flex;gap:4px;align-items:center">`;
    if (mode === 'single') {
      html += `<input type="date" class="date-range__input" data-name="${name || ''}">`;
      html += `<button class="btn btn--sm date-range__toggle" title="Switch to range">📅</button>`;
    } else {
      html += `<input type="date" class="date-range__from" data-name="${name || ''}-from" placeholder="From">`;
      html += `<span style="color:#999">–</span>`;
      html += `<input type="date" class="date-range__to" data-name="${name || ''}-to" placeholder="To">`;
      html += `<button class="btn btn--sm date-range__toggle" title="Switch to single">1️⃣</button>`;
    }
    html += '</div>';
    wrap.innerHTML = html;

    wrap.querySelector('.date-range__toggle').addEventListener('click', () => {
      mode = mode === 'single' ? 'range' : 'single';
      render();
      if (onChange) onChange(getValue());
    });

    wrap.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', () => {
        if (onChange) onChange(getValue());
      });
    });
  }

  function getValue() {
    if (mode === 'single') {
      const inp = wrap.querySelector('.date-range__input');
      return inp ? inp.value : '';
    } else {
      const from = wrap.querySelector('.date-range__from');
      const to = wrap.querySelector('.date-range__to');
      return { from: from ? from.value : '', to: to ? to.value : '' };
    }
  }

  function clear() {
    if (mode === 'single') {
      const inp = wrap.querySelector('.date-range__input');
      if (inp) inp.value = '';
    } else {
      const from = wrap.querySelector('.date-range__from');
      const to = wrap.querySelector('.date-range__to');
      if (from) from.value = '';
      if (to) to.value = '';
    }
  }

  render();
  container.appendChild(wrap);
  return { element: wrap, getValue, clear, getMode: () => mode };
}
