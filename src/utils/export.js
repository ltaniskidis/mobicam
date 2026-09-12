export function exportToCSV(scans, filename = 'scanned_codes.csv') {
  if (!scans || scans.length === 0) return;

  const headers = ['Timestamp', 'Date', 'Time', 'Format', 'Type', 'Content'];
  const rows = scans.map(item => {
    const d = new Date(item.time);
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toLocaleTimeString();
    const typeStr = item.parsed?.type || 'text';
    const cleanContent = (item.text || '').replace(/"/g, '""');
    return `"${item.time}","${dateStr}","${timeStr}","${item.formatName || ''}","${typeStr}","${cleanContent}"`;
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportToJSON(scans, filename = 'scanned_codes.json') {
  if (!scans || scans.length === 0) return;
  const jsonContent = JSON.stringify(scans, null, 2);
  downloadBlob(jsonContent, filename, 'application/json;charset=utf-8;');
}

export function exportToTXT(scans, filename = 'scanned_codes.txt') {
  if (!scans || scans.length === 0) return;
  const lines = scans.map((s, idx) => `[${idx + 1}] ${s.timeFormatted} (${s.formatName}): ${s.text}`);
  downloadBlob(lines.join('\r\n'), filename, 'text/plain;charset=utf-8;');
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
