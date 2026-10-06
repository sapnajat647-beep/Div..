import React from 'react';
import { NoteSummaryResult } from '../types';
import { X, Sparkles, Lightbulb, HelpCircle, CheckCircle2, Bookmark } from 'lucide-react';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryData: NoteSummaryResult | null;
  noteTitle: string;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  summaryData,
  noteTitle,
}) => {
  if (!isOpen || !summaryData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-stone-700 bg-[#161311] p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-stone-100 text-lg">AI Cognitive Summary</h3>
              <p className="text-xs text-stone-400 line-clamp-1">{noteTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Executive Summary */}
        <div className="rounded-xl border border-stone-800 bg-[#1a1715] p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <Bookmark className="h-3.5 w-3.5" />
            <span>Executive Synthesis</span>
          </div>
          <p className="text-sm text-stone-200 leading-relaxed">
            {summaryData.executiveSummary}
          </p>
        </div>

        {/* Key Takeaways */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Essential High-Yield Takeaways</span>
          </h4>
          <ul className="space-y-2 text-xs text-stone-300">
            {summaryData.keyTakeaways.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-[#141210] border border-stone-800/80">
                <span className="font-mono-numbers text-amber-400 font-bold shrink-0">{idx + 1}.</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Memory Aids / Mnemonics */}
        {summaryData.memoryAids && summaryData.memoryAids.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span>Mnemonics & Analogies</span>
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {summaryData.memoryAids.map((aid, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
                  💡 {aid}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Self-Test Review Questions */}
        {summaryData.recommendedReviewQuestions && summaryData.recommendedReviewQuestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-sky-400" />
              <span>Self-Testing Prompt Questions</span>
            </h4>
            <div className="space-y-1.5 text-xs text-stone-300">
              {summaryData.recommendedReviewQuestions.map((q, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800 flex items-start gap-2">
                  <span className="text-sky-400 font-bold font-mono-numbers">Q{idx + 1}:</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
          >
            Done Reading
          </button>
        </div>
      </div>
    </div>
  );
};
