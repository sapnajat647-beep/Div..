import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { QuizResultData } from '../types';
import {
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Home,
  Sparkles,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface QuizResultsProps {
  results: QuizResultData;
  onTryAgain: () => void;
  onBackToHome: () => void;
  onNewQuiz: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  results,
  onTryAgain,
  onBackToHome,
  onNewQuiz,
}) => {
  useEffect(() => {
    if (results.percentage >= 60) {
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#fbbf24', '#fef3c7'],
        });
      } catch {
        // ignore
      }
    }
  }, [results.percentage]);

  const getEncouragement = () => {
    if (results.percentage >= 90) return 'Exceptional mastery! Your active recall retention is sharp.';
    if (results.percentage >= 70) return 'Great performance! Review the nuances below to reinforce weak areas.';
    if (results.percentage >= 50) return 'Good foundation! Reviewing these explanations will boost your retrieval strength.';
    return 'Practice makes progress! Re-reading the explanations below will solidify these concepts.';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24 px-2 sm:px-4 animate-fade-in">
      {/* Score Summary Hero Card */}
      <div className="rounded-3xl border border-stone-800 bg-[#161311] p-6 sm:p-10 shadow-2xl text-center space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mx-auto shadow-inner">
          <Award className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
            {results.topic} · {results.difficulty}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-stone-100">
            Quiz Completed
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto leading-relaxed">
            {getEncouragement()}
          </p>
        </div>

        {/* Score & Metrics Box */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto p-4 rounded-2xl border border-stone-800/80 bg-[#12100e] font-mono-numbers">
          <div className="space-y-1">
            <span className="text-[11px] text-stone-500 uppercase tracking-wider">Score</span>
            <div className="text-2xl sm:text-3xl font-bold text-stone-100">
              {results.score} / {results.total}
            </div>
            <span className="text-xs text-amber-400 font-semibold">{results.percentage}%</span>
          </div>

          <div className="space-y-1 border-x border-stone-800/80">
            <span className="text-[11px] text-stone-500 uppercase tracking-wider">Correct</span>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400">
              {results.correctCount}
            </div>
            <span className="text-xs text-stone-400">Answers</span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-stone-500 uppercase tracking-wider">Wrong</span>
            <div className="text-2xl sm:text-3xl font-bold text-rose-400">
              {results.wrongCount}
            </div>
            <span className="text-xs text-stone-400">To Review</span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onTryAgain}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>

          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-stone-200 bg-stone-900 hover:bg-stone-800 border border-stone-700/80 rounded-xl transition-colors active:scale-95"
          >
            <Home className="h-4 w-4" />
            <span>Back to Home</span>
          </button>

          <button
            onClick={onNewQuiz}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-stone-400 hover:text-stone-200"
          >
            <span>Create New Quiz</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Answer & Explanation Review Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-stone-100 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-400" />
            <span>Detailed Answer Breakdown & Explanations</span>
          </h2>
          <span className="text-xs text-stone-500 font-mono">
            {results.questions.length} Questions
          </span>
        </div>

        <div className="space-y-4">
          {results.questions.map((q, idx) => {
            const userAns = results.userAnswers[q.id]?.trim() || '';
            const isCorrect =
              q.type === 'mcq'
                ? userAns.toLowerCase() === q.correctAnswer.trim().toLowerCase()
                : userAns.length > 5;

            return (
              <div
                key={q.id}
                className={`rounded-2xl border p-5 sm:p-6 transition-all space-y-4 ${
                  isCorrect
                    ? 'border-emerald-500/30 bg-[#141814]/80'
                    : 'border-rose-500/30 bg-[#1a1414]/80'
                }`}
              >
                {/* Header: Question Number & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-stone-500">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
                        isCorrect
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Correct</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Incorrect</span>
                        </>
                      )}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-stone-500 uppercase">
                    {q.type === 'mcq' ? 'MCQ' : 'Short Answer'}
                  </span>
                </div>

                {/* Question Prompt */}
                <h3 className="text-base font-semibold text-stone-100 leading-relaxed font-display">
                  {q.prompt}
                </h3>

                {/* Answers comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  {/* Student Answer */}
                  <div className="p-3 rounded-xl bg-[#110f0e] border border-stone-800 space-y-1">
                    <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                      Your Answer
                    </span>
                    <p
                      className={`font-medium ${
                        isCorrect
                          ? 'text-emerald-300'
                          : userAns
                          ? 'text-rose-300'
                          : 'text-stone-500 italic'
                      }`}
                    >
                      {userAns || '(No answer provided)'}
                    </p>
                  </div>

                  {/* Correct Target Answer */}
                  <div className="p-3 rounded-xl bg-[#110f0e] border border-stone-800 space-y-1">
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                      Correct Answer
                    </span>
                    <p className="font-semibold text-stone-200">
                      {q.correctAnswer}
                    </p>
                  </div>
                </div>

                {/* Short Explanation */}
                <div className="p-3.5 rounded-xl border border-stone-800 bg-[#110f0e] space-y-1 text-xs">
                  <span className="font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Explanation</span>
                  </span>
                  <p className="text-stone-300 leading-relaxed">
                    {q.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Mobile/Desktop Bottom Navigation Bar */}
      <div className="sticky bottom-4 z-20 max-w-md mx-auto p-2 rounded-2xl border border-stone-800 bg-[#161311]/95 backdrop-blur-md shadow-2xl flex items-center justify-between gap-2">
        <button
          onClick={onBackToHome}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold text-stone-300 bg-stone-900 hover:bg-stone-800 border border-stone-800 transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
        </button>

        <button
          onClick={onTryAgain}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
};
