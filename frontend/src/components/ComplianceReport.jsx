import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { getApiErrorMessage } from '../utils/formatters';

function escapeCsvValue(value) {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvRow(values) {
  return values.map(escapeCsvValue).join(',');
}

export default function ComplianceReport({ endpoint = '/api/admin/compliance-report', filenamePrefix = 'cybershield-compliance' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.get(endpoint);
      const { report = [] } = response.data.data;

      const headers = [
        'Name',
        'Email',
        'Role',
        'Modules Completed',
        'Certificate Earned',
        'Certificate Date',
        'Fraud Flagged',
        'Completion Minutes',
      ];

      const rows = report.map((row) =>
        buildCsvRow([
          row.name,
          row.email,
          row.role,
          row.modules_completed,
          row.certificate_earned ? 'Yes' : 'No',
          row.certificate_issued_at
            ? new Date(row.certificate_issued_at).toLocaleDateString()
            : '',
          row.fraud_flagged ? 'Yes' : 'No',
          row.completion_time_minutes ?? '',
        ])
      );

      const csv = [buildCsvRow(headers), ...rows].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const today = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `${filenamePrefix}-${today}.csv`;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to download compliance report.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="alert-error mb-3" role="alert">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
            aria-hidden="true"
          />
        )}
        {loading ? 'Generating report…' : 'Download Compliance Report'}
      </button>
    </div>
  );
}
