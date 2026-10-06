import React, { useState } from 'react';
import { QuizPackage, QuizQuestion, QuizResultData } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  Lightbulb,
  AlertCircle,
  X
} from 'lucide-react';

interface QuizInterfaceProps {
  quizPackage: QuizPackage;
  onExitQuiz: () => void;
  onSubmitQuiz: (results: QuizResultData) => void;
}

export const QuizInterface: React.FC<QuizInterfaceProps> = ({
  quizPackage,
  onExitQuiz,
  onSubmitQuiz,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [startTime] = useState<number>(Date.now());

  const questions = quizPackage.questions;
  const currentQ: QuizQuestion = questions[currentIndex];

  const handleSelectOption = (questionId: string, optionText: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionText,
    }));
  };

  const handleTextAnswerChange = (questionId: string, val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: val,
    }));
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleTriggerSubmit = () => {
    const answeredCount = Object.keys(answers).filter((k) => !!answers[k]?.trim()).length;
    if (answeredCount < questions.length) {
      setShowConfirmModal(true);
    } else {
      finalizeSubmission();
    }
  };

  const finalizeSubmission = () => {
    let correctCount = 0;
    let wrongCount = 0;

    questions.forEach((q) => {
      const userAns = (answers[q.id] || '').trim().toLowerCase();
      const targetAns = q.correctAnswer.trim().toLowerCase();

      if (q.type === 'mcq') {
        // Direct matching
        if (userAns === targetAns) {
          correctCount++;
        } else {
          wrongCount++;
        }
      } else {
        // For short answer, basic semantic keyword overlap check
        if (userAns.length > 5 && (targetAns.includes(userAns) || userAns.includes(targetAns) || targetAns.split(' ').some(w => w.length > 4 && userAns.includes(w)))) {
          correctCount++;
        } else if (userAns.length > 5) {
          correctCount++; // generous evaluation for attempting short answer
        } else {
          wrongCount++;
        }
      }
    });

    const total = questions.length;
    const score = correctCount;
    const percentage = Math.round((correctCount / total) * 100);
    const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);

    const resultData: QuizResultData = {
      score,
      total,
      percentage,
      correctCount,
      wrongCount,
      userAnswers: answers,
      questions,
      topic: quizPackage.topic,
      difficulty: quizPackage.difficulty,
      timeSpentSeconds,
    };

    onSubmitQuiz(resultData);
  };

  const isCurrentAnswered = !!answers[currentQ.id]?.trim();
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).filter((k) => !!answers[k]?.trim()).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 px-2 sm:px-4">
      {/* Top Bar: Exit + Subject + Progress */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExitQuiz}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800 rounded-lg transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          <span>Exit</span>
        </button>

        <div className="text-center">
          <span className="text-xs font-semibold text-amber-400 truncate max-w-[200px] block">
            {quizPackage.topic}
          </span>
          <span className="text-[11px] text-stone-500 font-mono">
            {quizPackage.difficulty} Difficulty
          </span>
        </div>

        <div className="text-xs font-mono-numbers text-stone-400 font-semibold bg-stone-900 px-2.5 py-1 rounded-lg border border-stone-800">
          {currentIndex + 1} / {questions.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-900 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-amber-400 h-1.5 transition-all duration-300 ease-out"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Main Question Card */}
      <div className="rounded-2xl border border-stone-800 bg-[#161311] p-6 sm:p-8 shadow-xl space-y-6">
        {/* Question Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
            <span>Question {currentIndex + 1}</span>
            <span className="capitalize text-amber-400/90 font-medium">
              {currentQ.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-semibold text-stone-100 leading-relaxed font-display">
            {currentQ.prompt}
          </h2>
        </div>

        {/* Hint toggle */}
        {currentQ.hint && (
          <div>
            {!revealedHints[currentQ.id] ? (
              <button
                type="button"
                onClick={() =>
                  setRevealedHints((prev) => ({ ...prev, [currentQ.id]: true }))
                }
                className="text-xs font-medium text-amber-400/80 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                <span>Show hint</span>
              </button>
            ) : (
              <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-200/90 flex items-start gap-2 animate-fade-in">
                <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Hint:</strong> {currentQ.hint}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Options for MCQ */}
        {currentQ.type === 'mcq' && currentQ.options && (
          <div className="space-y-2.5 pt-2">
            {currentQ.options.map((option, idx) => {
              const isSelected = answers[currentQ.id] === option;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(currentQ.id, option)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 min-h-[52px] ${
                    isSelected
                      ? 'border-amber-500/60 bg-amber-950/30 text-amber-200 shadow-sm shadow-amber-950/20'
                      : 'border-stone-800 bg-[#13110f] hover:bg-[#1a1715] hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-mono font-bold transition-colors ${
                      isSelected
                        ? 'bg-amber-400 text-stone-950'
                        : 'bg-stone-900 border border-stone-800 text-stone-400'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm leading-relaxed self-center">
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Short Answer text input */}
        {currentQ.type === 'short_answer' && (
          <div className="space-y-2 pt-2">
            <textarea
              rows={4}
              placeholder="Type your explanation or answer here..."
              value={answers[currentQ.id] || ''}
              onChange={(e) => handleTextAnswerChange(currentQ.id, e.target.value)}
              className="w-full bg-[#12100e] border border-stone-800 rounded-xl p-3.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/50 leading-relaxed"
            />
          </div>
        )}

        {/* Question Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-800/80">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-300 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {isLastQuestion ? (
              <button
                type="button"
                onClick={handleTriggerSubmit}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95"
              >
                <span>Submit Quiz</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-sm active:scale-95"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Answered progress overview dots */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2">
        {questions.map((q, idx) => {
          const answered = !!answers[q.id]?.trim();
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2.5 rounded-full transition-all ${
                isCurrent
                  ? 'w-6 bg-amber-400'
                  : answered
                  ? 'w-2.5 bg-amber-500/50'
                  : 'w-2.5 bg-stone-800'
              }`}
              title={`Go to question ${idx + 1}`}
            />
          );
        })}
      </div>

      {/* Early Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-stone-700 bg-[#161311] p-6 shadow-2xl space-y-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-stone-100 text-lg">
                Submit Incomplete Quiz?
              </h3>
              <p className="text-xs text-stone-400">
                You have answered <strong className="text-stone-200">{answeredCount}</strong> of{' '}
                <strong className="text-stone-200">{questions.length}</strong> questions. Unanswered questions will be marked incorrect.
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-300 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl transition-colors"
              >
                Keep Reviewing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  finalizeSubmission();
                }}
                className="px-5 py-2 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
