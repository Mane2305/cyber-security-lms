import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import QuestionCard from '../components/QuestionCard';
import ScoreScreen from '../components/ScoreScreen';
import axiosInstance from '../utils/axiosInstance';

const TOTAL_QUESTIONS = 5;
const INITIAL_ANSWERS = [null, null, null, null, null];
const QUESTION_TIME = 60;

function getQuizErrorMessage(err) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail?.message) return detail.message;
  return 'Something went wrong. Please try again.';
}

function getTimerColor(seconds) {
  if (seconds > 15) return 'text-green-600 dark:text-green-400';
  if (seconds >= 10) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

const btnSecondary =
  'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';

const btnPrimary =
  'rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40';

export default function QuizPage() {
  const { module_id } = useParams();
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState(INITIAL_ANSWERS);
  const [submittedResults, setSubmittedResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);

  const startQuiz = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.post('/api/quiz/start', { module_id });
      setQuizData(response.data.data);
      setCurrentQuestionIndex(0);
      setSelectedAnswers([...INITIAL_ANSWERS]);
      setSubmittedResults(null);
      setTimeLeft(QUESTION_TIME);
    } catch (err) {
      setError(getQuizErrorMessage(err));
      setQuizData(null);
    } finally {
      setLoading(false);
    }
  }, [module_id]);

  useEffect(() => {
    startQuiz();
  }, [startQuiz]);

  useEffect(() => {
    if (!quizData || submittedResults) return undefined;
    setTimeLeft(QUESTION_TIME);
  }, [currentQuestionIndex, quizData, submittedResults]);

  useEffect(() => {
    if (!quizData || submittedResults || loading) return undefined;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
            setCurrentQuestionIndex((i) => i + 1);
          }
          return QUESTION_TIME;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizData, submittedResults, loading, currentQuestionIndex]);

  const handleSelect = (optionIndex) => {
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[currentQuestionIndex] = optionIndex;
      return next;
    });
    setError(null);
  };

  const handleNext = () => {
    if (selectedAnswers[currentQuestionIndex] === null) return;
    setCurrentQuestionIndex((i) => Math.min(i + 1, TOTAL_QUESTIONS - 1));
  };

  const handleSubmit = async () => {
    const allAnswered = selectedAnswers.every((a) => a !== null);
    if (!allAnswered) {
      setError('Please answer all questions before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const response = await axiosInstance.post('/api/quiz/submit', {
        attempt_id: quizData.attempt_id,
        answers: selectedAnswers,
      });
      setSubmittedResults(response.data.data);
    } catch (err) {
      setError(getQuizErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setQuizData(null);
    setSelectedAnswers([...INITIAL_ANSWERS]);
    setCurrentQuestionIndex(0);
    setSubmittedResults(null);
    setError(null);
    startQuiz();
  };

  const currentQuestion = quizData?.questions?.[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === TOTAL_QUESTIONS - 1;
  const canProceed = selectedAnswers[currentQuestionIndex] !== null;

  return (
    <div>
      {loading && (
        <div className="flex justify-center py-20">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600 dark:border-slate-700 dark:border-t-cyan-400"
            role="status"
            aria-label="Loading quiz"
          />
        </div>
      )}

      {!loading && error && !quizData && !submittedResults && (
        <div className="text-center">
          <div className="alert-error mx-auto max-w-md" role="alert">
            {error}
          </div>
          <button type="button" onClick={() => navigate('/dashboard/employee')} className={`mt-5 ${btnSecondary}`}>
            Back to dashboard
          </button>
        </div>
      )}

      {!loading && submittedResults && (
        <ScoreScreen
          results={submittedResults}
          onRetry={handleRetry}
          onGoToDashboard={() => navigate('/dashboard/employee')}
        />
      )}

      {!loading && quizData && !submittedResults && (
        <>
          <div className="panel mb-5 flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Question {currentQuestionIndex + 1} of {TOTAL_QUESTIONS}
              </p>
              <div className="mt-2 flex gap-1.5">
                {selectedAnswers.map((answer, index) => (
                  <span
                    key={index}
                    className={`h-2 w-8 rounded-full transition ${
                      index === currentQuestionIndex
                        ? 'bg-cyan-500'
                        : answer !== null
                          ? 'bg-cyan-300 dark:bg-cyan-600'
                          : 'bg-slate-200 dark:bg-slate-600'
                    }`}
                    aria-label={`Question ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            <div className={`text-xl font-bold tabular-nums ${getTimerColor(timeLeft)}`}>
              {timeLeft}s
            </div>
          </div>

          <AnimatePresence mode="wait">
            {currentQuestion && (
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
              >
                <QuestionCard
                  question={currentQuestion}
                  selectedOption={selectedAnswers[currentQuestionIndex]}
                  onSelect={handleSelect}
                  disabled={false}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="alert-error mt-4" role="alert">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            {isLastQuestion ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed || submitting}
                className={btnPrimary}
              >
                {submitting ? 'Submitting…' : 'Submit quiz'}
              </button>
            ) : (
              <button type="button" onClick={handleNext} disabled={!canProceed} className={btnPrimary}>
                Next
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
