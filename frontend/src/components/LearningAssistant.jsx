import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';

export default function LearningAssistant({ moduleId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const historyEndRef = useRef(null);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleAsk = async () => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.post('/api/ai/ask', {
        module_id: moduleId,
        question: trimmed,
      });
      const answer = response.data.data.answer;
      setHistory((prev) => [...prev, { question: trimmed, answer }]);
      setQuestion('');
    } catch {
      setError('Could not get an answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div
          className="flex h-[min(420px,70vh)] w-[min(340px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
          role="dialog"
          aria-label="AI Learning Assistant"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Learning assistant</h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="Close assistant"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {history.length === 0 && !loading && (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Ask anything about this module.
              </p>
            )}

            <div className="space-y-3">
              {history.map((entry, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-end">
                    <p className="max-w-[85%] rounded-lg rounded-br-sm bg-cyan-600 px-3 py-2 text-sm text-white">
                      {entry.question}
                    </p>
                  </div>
                  <div className="flex justify-start">
                    <p className="max-w-[85%] rounded-lg rounded-bl-sm bg-slate-100 px-3 py-2 text-sm text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                      {entry.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {loading && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <div
                  className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-600 dark:border-slate-600 dark:border-t-cyan-400"
                  role="status"
                  aria-label="Loading answer"
                />
                <span>Thinking…</span>
              </div>
            )}

            {error && (
              <p className="alert-error mt-3" role="alert">
                {error}
              </p>
            )}

            <div ref={historyEndRef} />
          </div>

          <div className="border-t border-slate-200 p-3 dark:border-slate-700">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question…"
              rows={2}
              disabled={loading}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={handleAsk}
              disabled={!question.trim() || loading}
              className="mt-2 w-full rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Ask
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full bg-cyan-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-cyan-500"
          aria-expanded={isOpen}
          aria-label="Open learning assistant"
        >
          <MessageCircle className="h-5 w-5" />
          Ask AI
        </button>
      )}
    </div>
  );
}
