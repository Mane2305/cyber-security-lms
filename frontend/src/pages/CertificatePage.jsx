import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CertificateTemplate from '../components/CertificateTemplate';
import axiosInstance from '../utils/axiosInstance';
import { downloadCertificate } from '../utils/certificateGenerator';

const btnSecondary =
  'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';

export default function CertificatePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [checkData, setCheckData] = useState(null);
  const [modulesCompleted, setModulesCompleted] = useState(0);
  const [certificateData, setCertificateData] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        setLoading(true);
        setError('');

        const checkResponse = await axiosInstance.get('/api/rewards/certificate/check');
        const check = checkResponse.data.data;
        setCheckData(check);

        if (!check.eligible) {
          setEligible(false);
          const badgesResponse = await axiosInstance.get('/api/rewards/badges');
          const earned = badgesResponse.data.data.badges.filter((b) => b.earned).length;
          setModulesCompleted(earned);
          return;
        }

        setEligible(true);
        const generateResponse = await axiosInstance.post('/api/rewards/certificate/generate');
        setCertificateData(generateResponse.data.data);
      } catch (err) {
        const message =
          err?.response?.data?.detail?.message ||
          err?.response?.data?.detail ||
          'Failed to load certificate. Please try again.';
        setError(typeof message === 'string' ? message : 'Failed to load certificate. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadCertificate();
  }, []);

  const handleDownload = async () => {
    if (!certificateData) return;
    try {
      setDownloading(true);
      await downloadCertificate(certificateData);
    } catch (err) {
      console.error('Certificate download failed:', err);
      setError('Failed to download certificate. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5">
      {loading && (
        <div className="flex justify-center py-20">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600 dark:border-slate-700 dark:border-t-cyan-400"
            role="status"
            aria-label="Loading certificate"
          />
        </div>
      )}

      {!loading && error && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && !eligible && checkData && (
        <div className="panel mx-auto max-w-lg p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Not eligible yet</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            You have completed{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-200">{modulesCompleted}</span> of{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-200">8</span> modules.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Complete and pass all 8 training modules to earn your certificate.
          </p>
          <button type="button" onClick={() => navigate('/dashboard/employee')} className={`mt-6 ${btnSecondary}`}>
            Back to dashboard
          </button>
        </div>
      )}

      {!loading && !error && eligible && certificateData && (
        <>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {downloading ? 'Preparing download…' : 'Download certificate'}
            </button>
          </div>

          <div className="panel overflow-x-auto p-4">
            <CertificateTemplate certificateData={certificateData} />
          </div>
        </>
      )}
    </div>
  );
}
