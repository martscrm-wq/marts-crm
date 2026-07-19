// export.js — T230-T233: CSV, Excel, PDF, JSON export (REQ-801-805)
import { formatCurrency, formatDate } from './format.js';

export function exportCSV(rows, columns, filename = 'export.csv') {
  const header = columns.map(c => c.label).join(',');
  const lines = rows.map(r => columns.map(c => {
    let val = c.sortValue ? c.sortValue(r) : r[c.key];
    if (val == null) val = '';
    val = String(val).replace(/"/g, '""');
    return `"${val}"`;
  }).join(','));
  const csv = [header, ...lines].join('\n');
  download(csv, filename, 'text/csv');
}

export function exportJSON(rows, filename = 'export.json') {
  const json = JSON.stringify(rows, null, 2);
  download(json, filename, 'application/json');
}

// SheetJS CDN loaded dynamically for Excel export
export async function exportExcel(rows, columns, filename = 'export.xlsx') {
  if (typeof XLSX === 'undefined') {
    await loadScript('https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js');
  }
  const data = rows.map(r => {
    const obj = {};
    columns.forEach(c => { obj[c.label] = c.sortValue ? c.sortValue(r) : r[c.key]; });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, filename);
}

// jsPDF CDN loaded dynamically for PDF export
export async function exportPDF(rows, columns, filename = 'export.pdf') {
  if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
  }
  const { jsPDF: JsPDF } = window.jspdf || window;
  const doc = new JsPDF();
  const headers = columns.map(c => c.label);
  const body = rows.map(r => columns.map(c => String(c.sortValue ? c.sortValue(r) : r[c.key] ?? '')));
  doc.autoTable({ head: [headers], body, startY: 20 });
  doc.save(filename);
}

function download(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
