import { ComplianceAuditRecord, ComplianceReportSummary } from '../services/reports.service';

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function formatRecordsToCSV(records: ComplianceAuditRecord[]): string {
  const headers = [
    'Event ID',
    'Category',
    'Timestamp',
    'Title',
    'Status',
    'Actor',
    'Duration (s)',
    'Run ID',
    'Details',
  ];

  const rows = records.map((r) => [
    escapeCsvCell(r.id),
    escapeCsvCell(r.category),
    escapeCsvCell(r.timestamp),
    escapeCsvCell(r.title),
    escapeCsvCell(r.status),
    escapeCsvCell(r.actor),
    escapeCsvCell(r.durationSeconds),
    escapeCsvCell(r.runId),
    escapeCsvCell(r.details),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function formatRecordsToJSON(
  records: ComplianceAuditRecord[],
  metrics: ComplianceReportSummary['metrics']
): string {
  return JSON.stringify(
    {
      platform: 'OpsPilot Autonomous Operations',
      generatedAt: new Date().toISOString(),
      recordCount: records.length,
      summary: metrics,
      records,
    },
    null,
    2
  );
}

export function triggerBrowserDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
