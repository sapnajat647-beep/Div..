import React, { useState, useRef } from 'react';
import { DifficultyLevel, QuestionType, QuizPackage } from '../types';
import {
  FileText,
  Link as LinkIcon,
  Edit3,
  UploadCloud,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Globe,
  Brain
} from 'lucide-react';

interface AIQuestionGeneratorPageProps {
  onBackToHome: () => void;
  onQuestionsGenerated: (pkg: QuizPackage) => void;
}

type InputSource = 'pdf' | 'link' | 'text';

const SUBJECT_OPTIONS = [
  'General Studies',
  'Biology & Life Sciences',
  'Computer Science & Tech',
  'History & Social Studies',
  'Physics & Engineering',
  'Chemistry',
  'Mathematics',
  'Psychology',
  'Economics & Business',
  'Literature & Language',
  'Medicine & Health',
  'Other / Custom'
];

const SAMPLE_TEXTS = [
  {
    title: 'Photosynthesis & ATP',
    subject: 'Biology & Life Sciences',
    text: 'Photosynthesis occurs in chloroplasts. The light-dependent reactions take place in the thylakoid membranes, where chlorophyll absorbs light energy to split water into oxygen, protons, and electrons. The electron transport chain generates a proton gradient that drives ATP synthase to produce ATP, while NADP+ is reduced to NADPH. In the stroma, the Calvin cycle uses ATP, NADPH, and RuBisCO to fix atmospheric carbon dioxide into glyceraldehyde-3-phosphate (G3P), which is then converted into glucose.'
  },
  {
    title: 'Algorithms: Sorting & Complexity',
    subject: 'Computer Science & Tech',
    text: 'Comparison-based sorting algorithms have a lower bound of O(n log n) comparisons in the worst case. QuickSort uses a divide-and-conquer strategy by selecting a pivot, partitioning elements smaller and larger, and recursing. While its average time complexity is O(n log n), its worst-case is O(n^2) when an unbalanced pivot is chosen repeatedly. MergeSort is stable and guarantees O(n log n) worst-case time by splitting arrays in half and merging, requiring O(n) auxiliary space.'
  },
  {
    title: 'Newtonian Laws of Motion',
    subject: 'Physics & Engineering',
    text: "Newton's First Law states an object remains at rest or in uniform linear motion unless acted upon by a net external force. The Second Law establishes that force equals the time rate of change of momentum (F = dp/dt = ma for constant mass). The Third Law dictates that whenever one body exerts a force on a second body, the second body exerts an equal and opposite force on the first. Mechanical work is the dot product of force and displacement."
  }
];

export const AIQuestionGeneratorPage: React.FC<AIQuestionGeneratorPageProps> = ({
  onBackToHome,
  onQuestionsGenerated,
}) => {
  const [sourceType, setSourceType] = useState<InputSource>('text');

  // Input states
  const [studyText, setStudyText] = useState('');
  const [pdfFile, setPdfFile] = useState<{ name: string; size: string; base64: string } | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [fetchedUrlContent, setFetchedUrlContent] = useState<{ title: string; text: string } | null>(null);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);

  // Configuration options
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [customSubject, setCustomSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionType, setQuestionType] = useState<QuestionType>('mcq');
  const [marksPerQuestion, setMarksPerQuestion] = useState<number>(1);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle PDF file selection
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please select a valid PDF file.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('PDF file is too large. Please select a file under 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Str = reader.result as string;
      setPdfFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        base64: base64Str,
      });
      if (!topic) {
        setTopic(file.name.replace(/\.pdf$/i, ''));
      }
      setErrorMessage(null);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read PDF file.');
    };
    reader.readAsDataURL(file);
  };

  // Handle Website URL fetch
  const handleFetchWebsite = async () => {
    if (!websiteUrl.trim()) {
      setErrorMessage('Please enter a website link.');
      return;
    }

    setIsFetchingUrl(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to fetch webpage text.');
      }

      const data = await res.json();
      setFetchedUrlContent(data);
      if (!topic && data.title) {
        setTopic(data.title.slice(0, 50));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Could not fetch web page. Please paste the text manually.');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // Handle Generate Questions
  const handleGenerate = async () => {
    setErrorMessage(null);

    let contentToSend = '';
    let pdfBase64ToSend: string | undefined = undefined;

    if (sourceType === 'pdf') {
      if (!pdfFile) {
        setErrorMessage('Please upload a PDF document first.');
        return;
      }
      pdfBase64ToSend = pdfFile.base64;
    } else if (sourceType === 'link') {
      if (!fetchedUrlContent) {
        setErrorMessage('Please click "Fetch Link Content" or enter a valid study webpage.');
        return;
      }
      contentToSend = fetchedUrlContent.text;
    } else {
      if (!studyText.trim()) {
        setErrorMessage('Please paste or type study notes or textbook text.');
        return;
      }
      contentToSend = studyText;
    }

    const finalSubject = subject === 'Other / Custom' && customSubject.trim() ? customSubject : subject;
    const finalTopic = topic.trim() || finalSubject || 'Study Material';

    setIsGenerating(true);

    try {
      const response = await fetch('/api/gemini/quiz-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentToSend,
          pdfBase64: pdfBase64ToSend,
          topic: finalTopic,
          questionType,
          difficulty,
          count: questionCount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 503 || errorData.error?.includes('503') || errorData.error?.includes('busy') || errorData.error?.includes('demand')) {
          throw new Error('AI is temporarily busy. Please try again in a moment.');
        }
        throw new Error(errorData.error || 'AI is temporarily busy. Please try again in a moment.');
      }

      const data: QuizPackage = await response.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('AI could not formulate questions. Please try providing more study content.');
      }

      // Pass generated quiz to parent flow to show Quiz Interface
      onQuestionsGenerated(data);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || '';
      if (
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('high demand') ||
        msg.includes('busy')
      ) {
        setErrorMessage('AI is temporarily busy. Please try again in a moment.');
      } else {
        setErrorMessage(msg || 'AI is temporarily busy. Please try again in a moment.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 px-2 sm:px-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </button>

        <span className="text-xs font-mono text-amber-400/90 font-medium">
          StudySpace AI
        </span>
      </div>

      {/* Title & Introduction */}
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-stone-100 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Brain className="h-6 w-6" />
          </div>
          <span>AI Question Generator</span>
        </h1>
        <p className="text-sm text-stone-400 mt-2">
          Upload notes, a PDF, or a web link to create personalized active recall questions and test your understanding.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="rounded-2xl border border-stone-800 bg-[#161311] p-5 sm:p-7 shadow-xl space-y-6">
        {/* Step 1: Input Source Selector */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider block">
            1. Source Material
          </label>

          {/* Source Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-[#12100e] border border-stone-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setSourceType('pdf');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-xs font-medium transition-all ${
                sourceType === 'pdf'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span className="truncate">Upload PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSourceType('link');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-xs font-medium transition-all ${
                sourceType === 'link'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
              }`}
            >
              <LinkIcon className="h-4 w-4" />
              <span className="truncate">Website Link</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSourceType('text');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-xs font-medium transition-all ${
                sourceType === 'text'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
              }`}
            >
              <Edit3 className="h-4 w-4" />
              <span className="truncate">Paste / Type</span>
            </button>
          </div>

          {/* Source Input Area: PDF */}
          {sourceType === 'pdf' && (
            <div className="space-y-3 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />

              {!pdfFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-stone-800 hover:border-amber-500/50 bg-[#12100e] hover:bg-[#191614] rounded-xl p-8 text-center transition-all group"
                >
                  <UploadCloud className="h-10 w-10 text-stone-500 group-hover:text-amber-400 mx-auto mb-3 transition-colors" />
                  <p className="text-sm font-semibold text-stone-200">
                    Click to upload your study PDF
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Textbooks, research papers, slide decks, or lecture notes (Max 15MB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-200">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-stone-200 line-clamp-1">{pdfFile.name}</p>
                      <p className="text-[11px] text-stone-400">{pdfFile.size} · Ready for AI analysis</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPdfFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Source Input Area: Website Link */}
          {sourceType === 'link' && (
            <div className="space-y-3 pt-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-stone-500" />
                  <input
                    type="url"
                    placeholder="https://en.wikipedia.org/wiki/... or article URL"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full bg-[#12100e] border border-stone-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleFetchWebsite}
                  disabled={isFetchingUrl || !websiteUrl.trim()}
                  className="px-4 py-2.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all disabled:opacity-50 shrink-0"
                >
                  {isFetchingUrl ? 'Fetching...' : 'Fetch Content'}
                </button>
              </div>

              {fetchedUrlContent && (
                <div className="p-3.5 rounded-xl border border-stone-800 bg-[#12100e] space-y-1.5 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Page content loaded: {fetchedUrlContent.title}</span>
                  </div>
                  <p className="text-[11px] text-stone-400 line-clamp-3 leading-relaxed">
                    {fetchedUrlContent.text}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Source Input Area: Paste/Type Text */}
          {sourceType === 'text' && (
            <div className="space-y-2 pt-2">
              <textarea
                rows={6}
                placeholder="Paste your study notes, textbook excerpt, chapter summary, or flashcard text here..."
                value={studyText}
                onChange={(e) => setStudyText(e.target.value)}
                className="w-full bg-[#12100e] border border-stone-800 rounded-xl p-3.5 text-xs font-mono text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/50 leading-relaxed"
              />

              {/* Sample topic quick buttons */}
              <div className="space-y-1">
                <span className="text-[11px] text-stone-500">Quick sample topics to test:</span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_TEXTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setStudyText(sample.text);
                        setTopic(sample.title);
                        setSubject(sample.subject);
                      }}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-amber-300 hover:border-amber-500/30 transition-colors"
                    >
                      {sample.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Subject & Topic Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-800/80">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider block">
              2. Subject Area
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[#12100e] border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
            >
              {SUBJECT_OPTIONS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>

            {subject === 'Other / Custom' && (
              <input
                type="text"
                placeholder="Enter custom subject..."
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="mt-2 w-full bg-[#12100e] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/50"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider block">
              Topic / Chapter Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Chapter 4: Cellular Respiration"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-[#12100e] border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Step 3: Difficulty, Number of Questions, Question Type, Marks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-stone-800/80">
          {/* Difficulty: Easy, Medium, Hard */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider block">
              3. Difficulty
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#12100e] border border-stone-800/80 rounded-xl">
              {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    difficulty === level
                      ? 'bg-amber-500/20 text-amber-300 font-semibold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Number of Questions */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider block">
              Questions
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#12100e] border border-stone-800/80 rounded-xl">
              {[3, 5, 10, 15].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    questionCount === cnt
                      ? 'bg-amber-500/20 text-amber-300 font-semibold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Question Type: MCQ, Short Answer, Mixed */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider block">
              Question Type
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#12100e] border border-stone-800/80 rounded-xl">
              {[
                { id: 'mcq' as QuestionType, label: 'MCQ' },
                { id: 'short_answer' as QuestionType, label: 'Short' },
                { id: 'mixed' as QuestionType, label: 'Mixed' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setQuestionType(t.id)}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    questionType === t.id
                      ? 'bg-amber-500/20 text-amber-300 font-semibold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Marks Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider block">
              Marks / Question
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#12100e] border border-stone-800/80 rounded-xl">
              {[1, 2, 5].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMarksPerQuestion(m)}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    marksPerQuestion === m
                      ? 'bg-amber-500/20 text-amber-300 font-semibold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-3.5 text-xs text-rose-300 flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Generate Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin text-stone-950" />
                <span>Reading Material & Formulating Questions...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Questions</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
