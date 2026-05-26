import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QuestionCard from '../components/QuestionCard';
import ScoreScreen from '../components/ScoreScreen';
import axiosInstance from '../utils/axiosInstance';

const TOTAL_QUESTIONS = 5;
const INITIAL_ANSWERS = [null, null, null, null, null];

function getQuizErrorMessage(err) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail?.message) return detail.message;
  return 'Something went wrong. Please try again.';
}

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

  const startQuiz = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.post('/api/quiz/start', { module_id });
      setQuizData(response.data.data);
      setCurrentQuestionIndex(0);
      setSelectedAnswers([...INITIAL_ANSWERS]);
      setSubmittedResults(null);
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

  const handleGoToDashboard = () => {
    navigate('/dashboard/employee');
  };

  const currentQuestion = quizData?.questions?.[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === TOTAL_QUESTIONS - 1;
  const currentSelected = selectedAnswers[currentQuestionIndex];
  const canProceed = currentSelected !== null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center">
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
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
        {loading && (
          <div className="flex justify-center py-24">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
              role="status"
              aria-label="Loading quiz"
            />
          </div>
        )}

        {!loading && error && !quizData && !submittedResults && (
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

        {!loading && submittedResults && (
          <ScoreScreen
            results={submittedResults}
            onRetry={handleRetry}
            onGoToDashboard={handleGoToDashboard}
          />
        )}

        {!loading && quizData && !submittedResults && (
          <>
            <div className="mb-6 text-center">
              <p className="text-sm font-medium text-slate-600">
                Question {currentQuestionIndex + 1} of {TOTAL_QUESTIONS}
              </p>
              <div className="mt-3 flex justify-center gap-2">
                {selectedAnswers.map((answer, index) => (
                  <span
                    key={index}
                    className={`h-3 w-3 rounded-full ${
                      answer !== null ? 'bg-blue-600' : 'border-2 border-slate-300 bg-white'
                    }`}
                    aria-label={`Question ${index + 1}${answer !== null ? ' answered' : ' unanswered'}`}
                  />
                ))}
              </div>
            </div>

            {currentQuestion && (
              <QuestionCard
                question={currentQuestion}
                selectedOption={currentSelected}
                onSelect={handleSelect}
                disabled={false}
              />
            )}

            {error && (
              <div
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="mt-8 flex justify-end">
              {isLastQuestion ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canProceed || submitting}
                  className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? 'Submitting…' : 'Submit Quiz'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
