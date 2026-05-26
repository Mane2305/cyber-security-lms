import { forwardRef } from 'react';

function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18 7 3.11v5.71c0 4.54-3.07 8.83-7 9.93-3.93-1.1-7-5.39-7-9.93V6.29l7-3.11z" />
    </svg>
  );
}

function formatIssuedDate(issuedAt) {
  const date = new Date(issuedAt);
  if (Number.isNaN(date.getTime())) return issuedAt;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const CertificateTemplate = forwardRef(function CertificateTemplate({ certificateData }, ref) {
  const { employee_name, issued_at, modules_completed, tenant_name, certificate_id } = certificateData;
  const issuedBy = tenant_name || 'Group SNS';

  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-[842px] bg-white p-8"
      style={{ aspectRatio: '297 / 210' }}
    >
      <div className="flex h-full flex-col border-4 border-amber-500 p-1">
        <div className="flex h-full flex-col border-2 border-slate-900 px-10 py-8">
          <div className="flex flex-col items-center text-center">
            <ShieldIcon className="h-14 w-14 text-slate-900" />
            <p className="mt-2 text-2xl font-bold tracking-wide text-slate-900">CyberShield</p>
          </div>

          <div className="mt-8 flex flex-1 flex-col items-center justify-center text-center">
            <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Certificate of Completion</h1>
            <p className="mt-3 text-lg font-medium text-amber-700 md:text-xl">
              in Cyber Security Awareness Training
            </p>

            <p className="mt-10 max-w-2xl text-base leading-relaxed text-slate-700 md:text-lg">
              This certifies that{' '}
              <span className="font-bold text-slate-900">{employee_name}</span> has successfully completed
              all{' '}
              <span className="font-bold text-slate-900">{modules_completed}</span> modules of the
              CyberShield Cyber Security Awareness Training Program
            </p>
          </div>

          <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-6">
            <div className="text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Issued by</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{issuedBy}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{formatIssuedDate(issued_at)}</p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">Certificate ID: {certificate_id}</p>
        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;
