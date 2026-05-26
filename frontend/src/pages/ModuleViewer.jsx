import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import LessonSlide from '../components/LessonSlide';

function getModuleErrorMessage(err) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail?.message) return detail.message;
  if (detail?.error === 'MODULE_LOCKED') return 'This module is locked. Complete previous modules first.';
  if (err?.response?.status === 404) return 'Module not found.';
  return 'Failed to load module. Please try again.';
}

export default function ModuleViewer() {
  const { module_id } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const fetchModule = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axiosInstance.get(`/api/modules/${module_id}`);
        setModule(response.data.data);
        setSlideIndex(0);
      } catch (err) {
        setError(getModuleErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [module_id]);

  const slides = module?.slides ?? [];
  const totalSlides = slides.length;
  const isFirstSlide = slideIndex === 0;
  const isLastSlide = totalSlides > 0 && slideIndex === totalSlides - 1;
  const currentSlide = slides[slideIndex];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/dashboard/employee')}
            className="flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back to Dashboard
          </button>
          {module && <h1 className="text-lg font-semibold text-slate-900">{module.title}</h1>}
          <div className="w-32" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        {loading && (
          <div className="flex justify-center py-24">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
              role="status"
              aria-label="Loading module"
            />
          </div>
        )}

        {!loading && error && (
          <div className="text-center">
            <div
              className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/employee')}
              className="mt-6 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {!loading && !error && module && (
          <>
            {totalSlides === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <p className="text-lg text-slate-600">Content coming soon</p>
              </div>
            ) : (
              <>
                <LessonSlide slide={currentSlide} />

                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">
                    Slide {slideIndex + 1} of {totalSlides}
                  </p>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-500"
                    disabled
                  >
                    Ask AI — Coming Soon
                  </button>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setSlideIndex((i) => i - 1)}
                    disabled={isFirstSlide}
                    className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  {isLastSlide ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/quiz/${module_id}`)}
                      className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      Take Quiz
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSlideIndex((i) => i + 1)}
                      className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      Next
                    </button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
