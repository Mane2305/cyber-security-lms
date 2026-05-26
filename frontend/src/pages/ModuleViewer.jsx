import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import LessonSlide from '../components/LessonSlide';
import LearningAssistant from '../components/LearningAssistant';
import ModuleSkeleton from '../components/skeletons/ModuleSkeleton';

function getModuleErrorMessage(err) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail?.message) return detail.message;
  if (detail?.error === 'MODULE_LOCKED') return 'This module is locked. Complete previous modules first.';
  if (err?.response?.status === 404) return 'Module not found.';
  return 'Failed to load module. Please try again.';
}

const btnSecondary =
  'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';

const btnPrimary =
  'rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40';

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

  if (loading) return <ModuleSkeleton />;

  return (
    <div className="space-y-5">
      {error && (
        <div className="text-center">
          <div className="alert-error mx-auto max-w-md" role="alert">
            {error}
          </div>
          <button type="button" onClick={() => navigate('/dashboard/employee')} className={`mt-5 ${btnSecondary}`}>
            Back to dashboard
          </button>
        </div>
      )}

      {!error && module && (
        <>
          <p className="page-lead">{module.title}</p>

          {totalSlides === 0 ? (
            <div className="panel px-6 py-12 text-center text-slate-500 dark:text-slate-400">
              No content available for this module.
            </div>
          ) : (
            <>
              <LessonSlide slide={currentSlide} />

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Slide {slideIndex + 1} of {totalSlides}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSlideIndex((i) => i - 1)}
                    disabled={isFirstSlide}
                    className={btnSecondary}
                  >
                    Previous
                  </button>
                  {isLastSlide ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/quiz/${module_id}`)}
                      className={btnPrimary}
                    >
                      Take quiz
                    </button>
                  ) : (
                    <button type="button" onClick={() => setSlideIndex((i) => i + 1)} className={btnPrimary}>
                      Next
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {!loading && !error && module && <LearningAssistant moduleId={module_id} />}
    </div>
  );
}
