import React, { useState, useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { FlashcardItem, Note, DifficultyLevel } from '../types';
import {
  Layers,
  RotateCw,
  CheckCircle2,
  XCircle,
  Shuffle,
  Plus,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Search,
  Edit2,
  Award,
  AlertCircle,
  X,
  BookOpen,
  Filter,
  Check,
  RotateCcw,
  Star,
  FileText,
  Upload,
  ArrowRight,
  Bookmark,
  FolderPlus,
  Layers as DeckIcon
} from 'lucide-react';

interface FlashcardsDeckProps {
  cards: FlashcardItem[];
  notes?: Note[];
  onSaveCards: (cards: FlashcardItem[]) => void;
  onNavigateToGenerator: () => void;
  onRecordFlashcardReview?: (count: number, subject?: string) => void;
}

export const FlashcardsDeck: React.FC<FlashcardsDeckProps> = ({
  cards,
  notes = [],
  onSaveCards,
  onRecordFlashcardReview,
}) => {
  // Main View: 'study' vs 'manage'
  const [activeTab, setActiveTab] = useState<'study' | 'manage'>('study');

  // Study Mode State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);

  // Session Progress tracking (which card IDs have been reviewed in current session)
  const [reviewedCardIds, setReviewedCardIds] = useState<Set<string>>(new Set());
  const [shuffleToast, setShuffleToast] = useState<string | null>(null);

  // Card Management Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashcardItem | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Add / Edit Form State
  const [formFront, setFormFront] = useState('');
  const [formBack, setFormBack] = useState('');
  const [formSubject, setFormSubject] = useState('Biology');
  const [formCustomSubject, setFormCustomSubject] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [formDifficulty, setFormDifficulty] = useState<DifficultyLevel>('Medium');
  const [formIsBookmarked, setFormIsBookmarked] = useState(false);

  // AI Generator Form State
  const [aiSourceMode, setAiSourceMode] = useState<'text' | 'notes' | 'pdf'>('text');
  const [aiStudyText, setAiStudyText] = useState('');
  const [aiSelectedNoteId, setAiSelectedNoteId] = useState<string>('');
  const [aiPdfFile, setAiPdfFile] = useState<{ name: string; base64: string } | null>(null);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState<number>(5);
  const [aiDifficulty, setAiDifficulty] = useState<DifficultyLevel>('Medium');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // AI Deck Destination: 'add_to_deck' vs 'create_deck'
  const [aiDeckMode, setAiDeckMode] = useState<'add_to_deck' | 'create_deck'>('add_to_deck');
  const [aiTargetDeck, setAiTargetDeck] = useState<string>('Biology');
  const [aiNewDeckName, setAiNewDeckName] = useState<string>('');

  // AI Preview of Generated Cards before finalizing
  const [generatedCardsPreview, setGeneratedCardsPreview] = useState<FlashcardItem[] | null>(null);

  // Touch swipe support for mobile
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Unique Subjects / Decks List
  const subjects = useMemo(() => {
    const set = new Set(cards.map((c) => c.subject || c.deckName || 'General'));
    return ['all', ...Array.from(set).filter(Boolean)];
  }, [cards]);

  // Filtered Cards for Study and Management
  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      const cardSubject = c.subject || c.deckName || 'General';
      const matchesSubject =
        selectedSubject === 'all' || cardSubject.toLowerCase() === selectedSubject.toLowerCase();
      const matchesBookmark = !onlyBookmarked || Boolean(c.isBookmarked);
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        cardSubject.toLowerCase().includes(q);
      return matchesSubject && matchesBookmark && matchesQuery;
    });
  }, [cards, selectedSubject, onlyBookmarked, searchQuery]);

  // Keep currentIndex in bounds when cards or filter changes
  useEffect(() => {
    if (currentIndex >= filteredCards.length && filteredCards.length > 0) {
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [filteredCards.length, currentIndex]);

  const currentCard = filteredCards[currentIndex];

  // Progress Metrics for current filtered deck
  const totalDeckCards = filteredCards.length;
  const reviewedCountInDeck = filteredCards.filter((c) => reviewedCardIds.has(c.id)).length;
  const progressPercent = totalDeckCards > 0 ? Math.round((reviewedCountInDeck / totalDeckCards) * 100) : 0;

  // Global Mastery Metrics
  const totalCardsCount = cards.length;
  const knownCount = cards.filter((c) => c.masteryLevel === 'mastered').length;
  const needReviewCount = cards.filter((c) => c.masteryLevel === 'learning').length;
  const bookmarkedCount = cards.filter((c) => c.isBookmarked).length;

  // Keyboard navigation for power study
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || showAddModal || editingCard || showAIModal) {
        return;
      }

      if (activeTab === 'study' && filteredCards.length > 0) {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          setIsFlipped((prev) => !prev);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleNext();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrev();
        } else if (e.key === '1') {
          e.preventDefault();
          handleMarkMastery('learning');
        } else if (e.key === '2') {
          e.preventDefault();
          handleMarkMastery('mastered');
        } else if (e.key.toLowerCase() === 'e' && currentCard) {
          e.preventDefault();
          handleOpenEditModal(currentCard);
        } else if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          handleShuffle();
        } else if (e.key.toLowerCase() === 'b' && currentCard) {
          e.preventDefault();
          handleToggleBookmark(currentCard.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, filteredCards.length, currentIndex, showAddModal, editingCard, showAIModal, currentCard]);

  // Study Mode Handlers
  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(Math.max(0, filteredCards.length - 1));
    }
  };

  const handleMarkMastery = (level: 'mastered' | 'learning') => {
    if (!currentCard) return;
    const updated = cards.map((c) =>
      c.id === currentCard.id ? { ...c, masteryLevel: level, lastReviewed: Date.now() } : c
    );
    onSaveCards(updated);

    // Track reviewed card ID for session progress
    setReviewedCardIds((prev) => new Set(prev).add(currentCard.id));
    if (onRecordFlashcardReview) {
      onRecordFlashcardReview(1, currentCard.subject);
    }

    // If all cards in deck reviewed, celebrate
    if (reviewedCountInDeck + 1 >= totalDeckCards && totalDeckCards > 0) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#10b981', '#ffffff', '#b45309'],
      });
    }

    handleNext();
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    onSaveCards(shuffled);
    setCurrentIndex(0);
    setShuffleToast('🔀 Deck shuffled!');
    setTimeout(() => setShuffleToast(null), 2000);
  };

  const handleToggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = cards.map((c) =>
      c.id === id ? { ...c, isBookmarked: !c.isBookmarked } : c
    );
    onSaveCards(updated);
  };

  const handleResetSessionProgress = () => {
    setReviewedCardIds(new Set());
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Touch swipe detection for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchEndX.current = e.changedTouches[0].clientX;
    const distance = touchStartX.current - touchEndX.current;

    if (distance > 50) {
      handleNext();
    } else if (distance < -50) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Add Card
  const handleOpenAddModal = () => {
    setFormFront('');
    setFormBack('');
    const defaultSub = selectedSubject !== 'all' ? selectedSubject : 'Biology';
    setFormSubject(defaultSub);
    setFormCustomSubject('');
    setIsCustomSubject(false);
    setFormDifficulty('Medium');
    setFormIsBookmarked(false);
    setShowAddModal(true);
  };

  const handleSaveNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFront.trim() || !formBack.trim()) return;

    const finalSubject = isCustomSubject
      ? formCustomSubject.trim() || 'General'
      : formSubject.trim() || 'General';

    const newCard: FlashcardItem = {
      id: `fc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      front: formFront.trim(),
      back: formBack.trim(),
      subject: finalSubject,
      difficulty: formDifficulty,
      isBookmarked: formIsBookmarked,
      masteryLevel: 'unseen',
      lastReviewed: Date.now(),
    };

    const updated = [newCard, ...cards];
    onSaveCards(updated);
    setShowAddModal(false);
    if (selectedSubject !== 'all' && selectedSubject !== finalSubject) {
      setSelectedSubject('all');
    }
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Edit Card
  const handleOpenEditModal = (card: FlashcardItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCard(card);
    setFormFront(card.front);
    setFormBack(card.back);
    setFormSubject(card.subject);
    setFormCustomSubject('');
    setIsCustomSubject(false);
    setFormDifficulty(card.difficulty || 'Medium');
    setFormIsBookmarked(Boolean(card.isBookmarked));
  };

  const handleSaveEditedCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard || !formFront.trim() || !formBack.trim()) return;

    const finalSubject = isCustomSubject
      ? formCustomSubject.trim() || 'General'
      : formSubject.trim() || 'General';

    const updated = cards.map((c) =>
      c.id === editingCard.id
        ? {
            ...c,
            front: formFront.trim(),
            back: formBack.trim(),
            subject: finalSubject,
            difficulty: formDifficulty,
            isBookmarked: formIsBookmarked,
          }
        : c
    );

    onSaveCards(updated);
    setEditingCard(null);
  };

  // Delete Card
  const handleDeleteCard = (id: string) => {
    if (cards.length <= 1) {
      alert('You must have at least one flashcard in your deck.');
      return;
    }
    const updated = cards.filter((c) => c.id !== id);
    onSaveCards(updated);
    setDeleteConfirmId(null);
    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1));
    }
    setIsFlipped(false);
  };

  // PDF Upload Handler for AI
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setAiError('Please upload a valid PDF file.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setAiError('PDF file size exceeds 8MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Str = reader.result as string;
      setAiPdfFile({
        name: file.name,
        base64: base64Str,
      });
      setAiError(null);
    };
    reader.onerror = () => {
      setAiError('Failed to read PDF file.');
    };
    reader.readAsDataURL(file);
  };

  // AI Flashcards Generation
  const handleGenerateAIFlashcards = async () => {
    let finalContent = '';

    if (aiSourceMode === 'text') {
      finalContent = aiStudyText.trim();
      if (!finalContent) {
        setAiError('Please enter some study text or notes.');
        return;
      }
    } else if (aiSourceMode === 'notes') {
      const selectedNote = notes.find((n) => n.id === aiSelectedNoteId);
      if (!selectedNote) {
        setAiError('Please select a study note.');
        return;
      }
      finalContent = `# ${selectedNote.title}\n\n${selectedNote.content}`;
    } else if (aiSourceMode === 'pdf') {
      if (!aiPdfFile) {
        setAiError('Please upload a PDF document.');
        return;
      }
    }

    setIsGeneratingAI(true);
    setAiError(null);

    const targetDeckName =
      aiDeckMode === 'create_deck'
        ? aiNewDeckName.trim() || 'Custom Deck'
        : aiTargetDeck || 'General';

    try {
      const res = await fetch('/api/gemini/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: finalContent,
          pdfBase64: aiPdfFile?.base64,
          topic: aiTopic.trim() || targetDeckName,
          count: aiCount,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'AI is temporarily busy. Please try again in a moment.');
      }

      const data = await res.json();
      if (!data.cards || data.cards.length === 0) {
        throw new Error('AI could not formulate flashcards from this content. Please try adding more detail.');
      }

      const generated: FlashcardItem[] = data.cards.map((c: any) => ({
        id: `fc-ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        front: c.front,
        back: c.back,
        subject: targetDeckName,
        difficulty: (c.difficulty as DifficultyLevel) || aiDifficulty,
        isBookmarked: false,
        masteryLevel: 'unseen',
        lastReviewed: Date.now(),
      }));

      // Open interactive preview stage so student can inspect/edit cards before saving!
      setGeneratedCardsPreview(generated);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'AI is temporarily busy. Please try again in a moment.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Confirm and Save Generated Cards to Deck
  const handleFinalizeSaveGeneratedCards = () => {
    if (!generatedCardsPreview || generatedCardsPreview.length === 0) return;

    const merged = [...generatedCardsPreview, ...cards];
    onSaveCards(merged);

    const targetSubject = generatedCardsPreview[0].subject;
    setSelectedSubject(targetSubject);
    setCurrentIndex(0);
    setIsFlipped(false);
    setActiveTab('study');

    // Reset AI modal states
    setGeneratedCardsPreview(null);
    setShowAIModal(false);
    setAiStudyText('');
    setAiTopic('');
    setAiPdfFile(null);
    setAiNewDeckName('');

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#fbbf24', '#ffffff'],
    });
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto px-2 sm:px-4 animate-fade-in">
      {/* Toast Notification */}
      {shuffleToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-stone-900 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-full shadow-xl animate-bounce">
          {shuffleToast}
        </div>
      )}

      {/* Top Header with Action CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-stone-100 flex items-center gap-2.5">
            <Layers className="h-7 w-7 text-amber-400" />
            <span>Active Recall Flashcards</span>
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Strengthen memory retention with spaced retrieval practice and active testing.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => {
              setGeneratedCardsPreview(null);
              setShowAIModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-200 bg-stone-900 hover:bg-stone-800 border border-stone-700/80 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>AI Generate Cards</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Card</span>
          </button>
        </div>
      </div>

      {/* PROGRESS BAR & SCOREBOARD */}
      <div className="rounded-2xl border border-stone-800 bg-[#161311] p-4 sm:p-5 shadow-lg space-y-3 font-mono-numbers">
        {/* Progress bar title: e.g. "4/10 reviewed" */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-1.5 font-sans">
            <Award className="h-4 w-4 text-amber-400" />
            <span>Session Progress:</span>
            <strong className="text-amber-400 font-bold font-mono">
              {reviewedCountInDeck} / {totalDeckCards} reviewed ({progressPercent}%)
            </strong>
          </span>

          <div className="flex items-center gap-3">
            {reviewedCountInDeck > 0 && (
              <button
                onClick={handleResetSessionProgress}
                className="text-[11px] text-stone-500 hover:text-stone-300 flex items-center gap-1 transition-colors font-sans"
                title="Restart review session"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Session</span>
              </button>
            )}
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-stone-900 rounded-full h-2.5 overflow-hidden border border-stone-800">
          <div
            className="bg-gradient-to-r from-amber-500 to-amber-300 h-2.5 rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Metric Counts */}
        <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs border-t border-stone-800/80">
          <div>
            <strong className="block text-stone-100 text-base font-bold">{totalCardsCount}</strong>
            <span className="text-[11px] text-stone-500 font-sans">Total Cards</span>
          </div>
          <div>
            <strong className="block text-emerald-400 text-base font-bold">{knownCount}</strong>
            <span className="text-[11px] text-stone-500 font-sans">Known</span>
          </div>
          <div>
            <strong className="block text-amber-400 text-base font-bold">{needReviewCount}</strong>
            <span className="text-[11px] text-stone-500 font-sans">Need Review</span>
          </div>
          <div>
            <strong className="block text-amber-300 text-base font-bold flex items-center justify-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 inline" />
              <span>{bookmarkedCount}</span>
            </strong>
            <span className="text-[11px] text-stone-500 font-sans">Starred</span>
          </div>
        </div>
      </div>

      {/* Main Mode Toggle: Study Mode vs Manage Cards */}
      <div className="flex items-center justify-between border-b border-stone-800/80 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1 p-1 bg-[#12100e] border border-stone-800 rounded-xl text-xs">
          <button
            onClick={() => {
              setActiveTab('study');
              setIsFlipped(false);
            }}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'study'
                ? 'bg-amber-400 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Study Mode
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'manage'
                ? 'bg-amber-400 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Manage Deck ({cards.length})
          </button>
        </div>

        {activeTab === 'study' && (
          <div className="flex items-center gap-2">
            {/* Prominent Shuffle Button */}
            <button
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-stone-200 bg-stone-900 hover:bg-stone-800 border border-stone-700/80 hover:border-amber-500/40 rounded-xl transition-all active:scale-95 shadow-sm"
              title="Shuffle card order"
            >
              <Shuffle className="h-3.5 w-3.5 text-amber-400" />
              <span>Shuffle 🔀</span>
            </button>
          </div>
        )}
      </div>

      {/* Subject Filter Bar with Bookmark Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-stone-500 flex items-center gap-1 pr-1 font-sans text-[11px] shrink-0">
          <Filter className="h-3 w-3" />
          <span>Deck:</span>
        </span>

        {/* All Subjects Pill */}
        {subjects.map((sub) => (
          <button
            key={sub}
            onClick={() => {
              setSelectedSubject(sub);
              setOnlyBookmarked(false);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap capitalize transition-colors font-medium shrink-0 ${
              selectedSubject === sub && !onlyBookmarked
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'bg-stone-900/60 text-stone-400 hover:bg-stone-800 hover:text-stone-200 border border-stone-800/80'
            }`}
          >
            {sub === 'all' ? `All Decks (${cards.length})` : sub}
          </button>
        ))}

        {/* Bookmark Filter Pill */}
        <button
          onClick={() => {
            setOnlyBookmarked(!onlyBookmarked);
            setCurrentIndex(0);
            setIsFlipped(false);
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium shrink-0 flex items-center gap-1.5 ${
            onlyBookmarked
              ? 'bg-amber-500/25 text-amber-300 border border-amber-500 font-semibold shadow-sm'
              : 'bg-stone-900/60 text-stone-400 hover:bg-stone-800 hover:text-stone-200 border border-stone-800/80'
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${onlyBookmarked ? 'text-amber-400 fill-amber-400' : 'text-stone-400'}`} />
          <span>⭐ Bookmarked ({bookmarkedCount})</span>
        </button>
      </div>

      {/* TAB 1: STUDY MODE */}
      {activeTab === 'study' && (
        <div className="space-y-6">
          {filteredCards.length === 0 ? (
            <div className="rounded-2xl border border-stone-800 bg-[#161311] p-12 text-center space-y-4">
              <Layers className="h-10 w-10 text-stone-600 mx-auto" />
              <h3 className="text-base font-semibold text-stone-200">
                {onlyBookmarked ? 'No Bookmarked Flashcards' : 'No cards in this category'}
              </h3>
              <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
                {onlyBookmarked
                  ? 'Star important flashcards during study to review them here.'
                  : 'Create custom cards or use AI Generate to formulate flashcards from your study notes or PDFs.'}
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                {onlyBookmarked ? (
                  <button
                    onClick={() => setOnlyBookmarked(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all"
                  >
                    View All Cards
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleOpenAddModal}
                      className="px-4 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all"
                    >
                      Create Card
                    </button>
                    <button
                      onClick={() => setShowAIModal(true)}
                      className="px-4 py-2 text-xs font-semibold text-stone-200 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl transition-all"
                    >
                      AI Generate
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Card Meta Header with Difficulty & Edit Button */}
              <div className="flex items-center justify-between text-xs text-stone-400 px-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300 font-mono-numbers">
                    Card {currentIndex + 1} of {filteredCards.length}
                  </span>

                  {/* Difficulty Tag */}
                  {currentCard.difficulty && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase border ${
                        currentCard.difficulty === 'Easy'
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                          : currentCard.difficulty === 'Hard'
                          ? 'bg-rose-950/40 text-rose-300 border-rose-500/40'
                          : 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {currentCard.difficulty === 'Easy'
                        ? '🟢 Easy'
                        : currentCard.difficulty === 'Hard'
                        ? '🔴 Hard'
                        : '🟡 Medium'}
                    </span>
                  )}
                </div>

                {/* Right controls: Edit Card ✏️ and Subject */}
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px]">
                    {currentCard.subject}
                  </span>

                  <button
                    onClick={(e) => handleOpenEditModal(currentCard, e)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700/80 text-stone-300 hover:text-amber-300 transition-colors text-xs font-medium active:scale-95"
                    title="Edit card content if AI generated an awkward answer"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-amber-400" />
                    <span>Edit Card ✏️</span>
                  </button>
                </div>
              </div>

              {/* 3D Flip Card Container with Touch Swipe support */}
              <div
                className="perspective-1000 w-full select-none"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  role="button"
                  tabIndex={0}
                  className={`cursor-pointer group relative min-h-[320px] sm:min-h-[380px] w-full rounded-3xl transition-transform duration-500 transform-style-preserve-3d shadow-2xl ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* FRONT FACE (Question / Term) */}
                  <div
                    className={`absolute inset-0 rounded-3xl border border-stone-800 bg-[#171412] group-hover:border-amber-500/40 p-6 sm:p-10 flex flex-col justify-between backface-hidden transition-colors ${
                      isFlipped ? 'pointer-events-none' : ''
                    }`}
                  >
                    {/* Top card indicator & Star Bookmark */}
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span className="uppercase tracking-widest font-mono text-[11px] text-amber-400/90 font-semibold flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        <span>Prompt / Term</span>
                      </span>

                      {/* Bookmark Star Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleBookmark(currentCard.id, e)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          currentCard.isBookmarked
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                            : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-amber-400 hover:border-amber-500/30'
                        }`}
                        title={currentCard.isBookmarked ? 'Bookmarked' : 'Add Bookmark ⭐'}
                      >
                        <Star
                          className={`h-4 w-4 ${currentCard.isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`}
                        />
                      </button>
                    </div>

                    {/* Center Content: Question / Term */}
                    <div className="my-auto py-6 text-center">
                      <h2 className="text-xl sm:text-2xl font-bold text-stone-100 leading-relaxed font-display">
                        {currentCard.front}
                      </h2>
                    </div>

                    {/* PROMINENT "TAP TO FLIP" CUE */}
                    <div className="flex flex-col items-center justify-center gap-2 border-t border-stone-800/80 pt-3">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold group-hover:bg-amber-500/20 group-hover:scale-105 transition-all shadow-sm">
                        <RotateCw className="h-3.5 w-3.5 text-amber-400 group-hover:rotate-180 transition-transform duration-500" />
                        <span>Tap to reveal answer</span>
                      </div>
                      <span className="text-[10px] text-stone-500 font-sans">
                        Space / Enter to flip · 1 = Review · 2 = Known
                      </span>
                    </div>
                  </div>

                  {/* BACK FACE (Answer / Definition) */}
                  <div
                    className={`absolute inset-0 rounded-3xl border border-amber-500/35 bg-[#191512] p-6 sm:p-10 flex flex-col justify-between backface-hidden rotate-y-180 shadow-inner ${
                      !isFlipped ? 'pointer-events-none' : ''
                    }`}
                  >
                    {/* Top card indicator & Star Bookmark */}
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span className="uppercase tracking-widest font-mono text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>Answer & Definition</span>
                      </span>

                      {/* Bookmark Star Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleBookmark(currentCard.id, e)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          currentCard.isBookmarked
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                            : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-amber-400'
                        }`}
                        title={currentCard.isBookmarked ? 'Bookmarked' : 'Add Bookmark ⭐'}
                      >
                        <Star
                          className={`h-4 w-4 ${currentCard.isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`}
                        />
                      </button>
                    </div>

                    {/* Center Content: Answer */}
                    <div className="my-auto py-6 text-center">
                      <p className="text-base sm:text-lg text-amber-100 leading-relaxed font-medium">
                        {currentCard.back}
                      </p>
                    </div>

                    {/* PROMINENT "TAP TO FLIP BACK" CUE */}
                    <div className="flex flex-col items-center justify-center gap-2 border-t border-stone-800/80 pt-3">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-900 border border-stone-700/80 text-stone-300 text-xs font-semibold group-hover:border-amber-500/40 transition-all shadow-sm">
                        <RotateCw className="h-3.5 w-3.5 text-amber-400 group-hover:rotate-180 transition-transform duration-500" />
                        <span>Tap to view prompt</span>
                      </div>
                      <span className="text-[10px] text-stone-500 font-sans">
                        Rate your recall below:
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation & Spaced Repetition Rating Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                {/* Previous & Next Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    onClick={handlePrev}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-4 py-3 rounded-xl border border-stone-800 bg-stone-900 text-stone-300 hover:bg-stone-800 hover:text-stone-100 transition-colors active:scale-95 text-xs font-semibold"
                    title="Previous card"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={handleNext}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-4 py-3 rounded-xl border border-stone-800 bg-stone-900 text-stone-300 hover:bg-stone-800 hover:text-stone-100 transition-colors active:scale-95 text-xs font-semibold"
                    title="Next card"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Spaced Repetition Mastery Buttons */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleMarkMastery('learning')}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-3 text-xs font-bold text-amber-300 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/40 rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    <XCircle className="h-4 w-4 text-amber-400" />
                    <span>Need to Review</span>
                  </button>

                  <button
                    onClick={() => handleMarkMastery('mastered')}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-3 text-xs font-bold text-emerald-300 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-500/40 rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Known</span>
                  </button>
                </div>
              </div>

              {/* Mobile Swipe Hint */}
              <div className="text-center text-[11px] text-stone-600 sm:hidden">
                Swipe left or right to switch cards · Tap card to flip
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANAGE CARDS */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          {/* Search bar & Create CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-stone-500" />
              <input
                type="text"
                placeholder="Search flashcards by question, answer, or deck..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161311] border border-stone-800 rounded-xl pl-9 pr-9 py-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-stone-500 hover:text-stone-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add Flashcard</span>
            </button>
          </div>

          {/* Cards List Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredCards.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-stone-800 bg-[#161311] p-10 text-center text-xs text-stone-500 space-y-2">
                <Layers className="h-8 w-8 text-stone-600 mx-auto" />
                <p>No flashcards found matching &quot;{searchQuery}&quot;.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-amber-400 hover:underline pt-1"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredCards.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-stone-800 bg-[#161311] p-4 flex flex-col justify-between space-y-3 hover:border-stone-700 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          {c.subject}
                        </span>
                        {c.difficulty && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase ${
                              c.difficulty === 'Easy'
                                ? 'text-emerald-400'
                                : c.difficulty === 'Hard'
                                ? 'text-rose-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {c.difficulty}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleToggleBookmark(c.id, e)}
                          className="text-stone-500 hover:text-amber-400"
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${c.isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`}
                          />
                        </button>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize ${
                            c.masteryLevel === 'mastered'
                              ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                              : c.masteryLevel === 'learning'
                              ? 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
                              : 'bg-stone-900 text-stone-400 border border-stone-800'
                          }`}
                        >
                          {c.masteryLevel === 'mastered'
                            ? 'Known'
                            : c.masteryLevel === 'learning'
                            ? 'Review'
                            : 'Unseen'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-stone-500 block mb-0.5">FRONT</span>
                      <h4 className="text-xs font-semibold text-stone-200 leading-snug line-clamp-2">
                        {c.front}
                      </h4>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-stone-500 block mb-0.5">BACK</span>
                      <p className="text-xs text-stone-400 leading-relaxed line-clamp-3">
                        {c.back}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800/80">
                    <button
                      onClick={(e) => handleOpenEditModal(c, e)}
                      className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
                      title="Edit Flashcard ✏️"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span className="text-[11px]">Edit ✏️</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(c.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors flex items-center gap-1 text-xs"
                      title="Delete Flashcard"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="text-[11px]">Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CREATE NEW CARD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-stone-700 bg-[#161311] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-display font-bold text-lg text-stone-100 flex items-center gap-2">
                <Plus className="h-5 w-5 text-amber-400" />
                <span>Create Flashcard</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-200 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewCard} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                    Deck / Subject
                  </label>
                  <select
                    value={isCustomSubject ? 'custom' : formSubject}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomSubject(true);
                      } else {
                        setIsCustomSubject(false);
                        setFormSubject(e.target.value);
                      }
                    }}
                    className="w-full bg-[#12100e] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                  >
                    {subjects
                      .filter((s) => s !== 'all')
                      .map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    <option value="custom">+ New Deck / Subject...</option>
                  </select>

                  {isCustomSubject && (
                    <input
                      type="text"
                      value={formCustomSubject}
                      onChange={(e) => setFormCustomSubject(e.target.value)}
                      placeholder="Enter deck name..."
                      className="mt-2 w-full bg-[#12100e] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                    Difficulty Tag
                  </label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full bg-[#12100e] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="Easy">🟢 Easy</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Hard">🔴 Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                  Front (Question / Concept / Term)
                </label>
                <textarea
                  rows={3}
                  value={formFront}
                  onChange={(e) => setFormFront(e.target.value)}
                  placeholder="e.g. What is the terminal electron acceptor in the Electron Transport Chain?"
                  className="w-full bg-[#12100e] border border-stone-800 rounded-xl p-3 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50 leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                  Back (Answer / Definition / Explanation)
                </label>
                <textarea
                  rows={4}
                  value={formBack}
                  onChange={(e) => setFormBack(e.target.value)}
                  placeholder="e.g. Oxygen (O2), which binds protons and low-energy electrons to form water (H2O)."
                  className="w-full bg-[#12100e] border border-stone-800 rounded-xl p-3 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50 leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="add-bookmark"
                  checked={formIsBookmarked}
                  onChange={(e) => setFormIsBookmarked(e.target.checked)}
                  className="rounded border-stone-700 text-amber-500 accent-amber-500"
                />
                <label htmlFor="add-bookmark" className="text-xs text-stone-300 cursor-pointer flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  <span>Bookmark this card for quick review</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md active:scale-95"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CARD MODAL ✏️ */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-stone-700 bg-[#161311] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-display font-bold text-lg text-stone-100 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-amber-400" />
                <span>Edit Flashcard ✏️</span>
              </h3>
              <button
                onClick={() => setEditingCard(null)}
                className="text-stone-400 hover:text-stone-200 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-stone-400">
              Refine the prompt, definition, difficulty, or deck if AI generated an awkward or inaccurate answer.
            </p>

            <form onSubmit={handleSaveEditedCard} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                    Deck / Subject
                  </label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full bg-[#12100e] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                    Difficulty Tag
                  </label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full bg-[#12100e] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="Easy">🟢 Easy</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Hard">🔴 Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                  Front (Question / Concept / Term)
                </label>
                <textarea
                  rows={3}
                  value={formFront}
                  onChange={(e) => setFormFront(e.target.value)}
                  className="w-full bg-[#12100e] border border-stone-800 rounded-xl p-3 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50 leading-relaxed font-display text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                  Back (Answer / Definition / Explanation)
                </label>
                <textarea
                  rows={4}
                  value={formBack}
                  onChange={(e) => setFormBack(e.target.value)}
                  className="w-full bg-[#12100e] border border-stone-800 rounded-xl p-3 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50 leading-relaxed font-sans text-sm"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-bookmark"
                  checked={formIsBookmarked}
                  onChange={(e) => setFormIsBookmarked(e.target.checked)}
                  className="rounded border-stone-700 text-amber-500 accent-amber-500"
                />
                <label htmlFor="edit-bookmark" className="text-xs text-stone-300 cursor-pointer flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  <span>Bookmark this card ⭐</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md active:scale-95"
                >
                  Save Changes ✏️
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-stone-700 bg-[#161311] p-6 shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-lg text-stone-100 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-400" />
              <span>Delete Flashcard</span>
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Are you sure you want to delete this flashcard? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCard(deleteConfirmId)}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-md active:scale-95"
              >
                Delete Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI GENERATE FLASHCARDS MODAL (With Add to Deck / Create Deck & PDF/Notes support) */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-stone-700 bg-[#161311] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-display font-bold text-lg text-stone-100 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <span>AI Generate Flashcards</span>
              </h3>
              <button
                onClick={() => {
                  setShowAIModal(false);
                  setGeneratedCardsPreview(null);
                }}
                className="text-stone-400 hover:text-stone-200 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* STAGE 1: Configure & Generate */}
            {!generatedCardsPreview ? (
              <div className="space-y-4">
                <p className="text-xs text-stone-400 leading-relaxed">
                  Synthesize high-yield active recall flashcards from your study notes, uploaded PDF documents, or typed study text.
                </p>

                {/* Source Selection Tabs */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-[#12100e] border border-stone-800 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setAiSourceMode('text');
                      setAiError(null);
                    }}
                    className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      aiSourceMode === 'text'
                        ? 'bg-amber-400 text-stone-950 shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Paste Text</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiSourceMode('notes');
                      setAiError(null);
                      if (notes.length > 0 && !aiSelectedNoteId) {
                        setAiSelectedNoteId(notes[0].id);
                      }
                    }}
                    className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      aiSourceMode === 'notes'
                        ? 'bg-amber-400 text-stone-950 shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>My Notes ({notes.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiSourceMode('pdf');
                      setAiError(null);
                    }}
                    className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      aiSourceMode === 'pdf'
                        ? 'bg-amber-400 text-stone-950 shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload PDF</span>
                  </button>
                </div>

                {/* Source Input 1: Paste Text */}
                {aiSourceMode === 'text' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider">
                        Study Text / Material
                      </label>
                      <span className="text-[11px] text-stone-500">
                        {aiStudyText.length} characters
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      value={aiStudyText}
                      onChange={(e) => setAiStudyText(e.target.value)}
                      placeholder="Paste your study notes, definitions, or textbook concepts here..."
                      className="w-full bg-[#12100e] border border-stone-800 rounded-xl p-3 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50 leading-relaxed font-mono"
                    />

                    {/* Quick fill buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                      <span className="text-[11px] text-stone-500">Quick fill:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAiTopic('Cellular Respiration');
                          setAiTargetDeck('Biology');
                          setAiStudyText(
                            'Glycolysis converts glucose into 2 pyruvate, yielding net 2 ATP and 2 NADH. The Krebs cycle oxidizes acetyl-CoA, producing 6 NADH, 2 FADH2, and 2 ATP per glucose. Oxidative phosphorylation uses the proton gradient created by the electron transport chain to produce ~28 ATP via ATP synthase, with oxygen acting as the terminal electron acceptor.'
                          );
                        }}
                        className="text-[10px] bg-stone-900 border border-stone-800 text-stone-400 hover:text-amber-300 px-2 py-0.5 rounded transition-colors"
                      >
                        Biology ATP
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiTopic('Data Structures');
                          setAiTargetDeck('Computer Science');
                          setAiStudyText(
                            'A Binary Search Tree requires left children to be smaller than the root and right children to be larger. In a balanced BST like AVL or Red-Black, search, insert, and delete take O(log n). If elements are inserted in pre-sorted order, a standard BST degenerates into a linked list with O(n) worst-case time.'
                          );
                        }}
                        className="text-[10px] bg-stone-900 border border-stone-800 text-stone-400 hover:text-amber-300 px-2 py-0.5 rounded transition-colors"
                      >
                        Binary Trees
                      </button>
                    </div>
                  </div>
                )}

                {/* Source Input 2: Select From My Notes */}
                {aiSourceMode === 'notes' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider">
                      Select Note
                    </label>
                    {notes.length === 0 ? (
                      <p className="text-xs text-stone-500 p-4 border border-stone-800 rounded-xl">
                        No notes found in your notebook. You can switch to Paste Text or Upload PDF.
                      </p>
                    ) : (
                      <select
                        value={aiSelectedNoteId}
                        onChange={(e) => {
                          setAiSelectedNoteId(e.target.value);
                          const n = notes.find((note) => note.id === e.target.value);
                          if (n) {
                            setAiTopic(n.title);
                            setAiTargetDeck(n.subject || 'General');
                          }
                        }}
                        className="w-full bg-[#12100e] border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                      >
                        {notes.map((note) => (
                          <option key={note.id} value={note.id}>
                            {note.title} ({note.subject})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Source Input 3: Upload PDF */}
                {aiSourceMode === 'pdf' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider">
                      Upload PDF Study Material
                    </label>
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-800 hover:border-amber-500/50 rounded-2xl cursor-pointer bg-[#12100e] transition-colors">
                      <Upload className="h-8 w-8 text-amber-400 mb-2" />
                      <span className="text-xs font-semibold text-stone-200">
                        {aiPdfFile ? aiPdfFile.name : 'Choose a PDF file from your device'}
                      </span>
                      <span className="text-[11px] text-stone-500 mt-1">
                        Up to 8MB · AI will analyze and synthesize active recall cards
                      </span>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* DECK DESTINATION: "Add to Deck" vs "Create Deck" */}
                <div className="rounded-xl border border-stone-800 bg-[#12100e] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                      <DeckIcon className="h-4 w-4 text-amber-400" />
                      <span>Deck Destination:</span>
                    </span>

                    <div className="flex items-center gap-1 p-0.5 bg-stone-900 border border-stone-800 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => setAiDeckMode('add_to_deck')}
                        className={`px-3 py-1 rounded-md font-medium transition-all ${
                          aiDeckMode === 'add_to_deck'
                            ? 'bg-amber-400 text-stone-950 font-bold'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        Add to Deck
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiDeckMode('create_deck')}
                        className={`px-3 py-1 rounded-md font-medium transition-all ${
                          aiDeckMode === 'create_deck'
                            ? 'bg-amber-400 text-stone-950 font-bold'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        Create Deck
                      </button>
                    </div>
                  </div>

                  {aiDeckMode === 'add_to_deck' ? (
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">
                        Select Existing Deck:
                      </label>
                      <select
                        value={aiTargetDeck}
                        onChange={(e) => setAiTargetDeck(e.target.value)}
                        className="w-full bg-[#161311] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                      >
                        {subjects
                          .filter((s) => s !== 'all')
                          .map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">
                        New Deck Name:
                      </label>
                      <div className="flex items-center gap-2">
                        <FolderPlus className="h-4 w-4 text-amber-400 shrink-0" />
                        <input
                          type="text"
                          value={aiNewDeckName}
                          onChange={(e) => setAiNewDeckName(e.target.value)}
                          placeholder="e.g. Molecular Genetics Exam, Linear Algebra..."
                          className="w-full bg-[#161311] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Settings: Count & Difficulty */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                      Number of Cards
                    </label>
                    <select
                      value={aiCount}
                      onChange={(e) => setAiCount(parseInt(e.target.value))}
                      className="w-full bg-[#12100e] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                    >
                      <option value={3}>3 Cards</option>
                      <option value={5}>5 Cards</option>
                      <option value={8}>8 Cards</option>
                      <option value={10}>10 Cards</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value as DifficultyLevel)}
                      className="w-full bg-[#12100e] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="Easy">🟢 Easy</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="Hard">🔴 Hard</option>
                    </select>
                  </div>
                </div>

                {aiError && (
                  <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/20 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{aiError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setShowAIModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateAIFlashcards}
                    disabled={isGeneratingAI}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md disabled:opacity-50 active:scale-95"
                  >
                    {isGeneratingAI ? (
                      <>
                        <Sparkles className="h-3.5 w-3.5 animate-spin" />
                        <span>Synthesizing Cards with AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Generate Flashcards</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* STAGE 2: Review Generated Cards & Add to Deck / Create Deck */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-stone-100 text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Review Generated Flashcards ({generatedCardsPreview.length})</span>
                    </h4>
                    <p className="text-xs text-stone-400">
                      Edit any card ✏️ or remove unwanted ones before finalizing into your deck.
                    </p>
                  </div>

                  <span className="text-xs text-amber-400 font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
                    Deck: {generatedCardsPreview[0]?.subject}
                  </span>
                </div>

                {/* Cards Preview Grid with In-Place Edit */}
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {generatedCardsPreview.map((card, idx) => (
                    <div
                      key={card.id}
                      className="p-3.5 rounded-xl border border-stone-800 bg-[#12100e] space-y-2 relative group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[10px] text-stone-500 font-semibold">
                          Card #{idx + 1}
                        </span>

                        <div className="flex items-center gap-2">
                          <select
                            value={card.difficulty || 'Medium'}
                            onChange={(e) => {
                              const newDiff = e.target.value as DifficultyLevel;
                              setGeneratedCardsPreview((prev) =>
                                prev?.map((c) => (c.id === card.id ? { ...c, difficulty: newDiff } : c)) || null
                              );
                            }}
                            className="bg-stone-900 border border-stone-800 text-[10px] rounded px-1.5 py-0.5 text-stone-300"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => {
                              setGeneratedCardsPreview((prev) =>
                                prev?.filter((c) => c.id !== card.id) || null
                              );
                            }}
                            className="text-stone-500 hover:text-rose-400 p-1"
                            title="Remove card"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Editable Front */}
                      <div>
                        <label className="text-[10px] uppercase font-mono text-stone-500 block mb-0.5">
                          Prompt / Term (Front)
                        </label>
                        <input
                          type="text"
                          value={card.front}
                          onChange={(e) => {
                            const val = e.target.value;
                            setGeneratedCardsPreview((prev) =>
                              prev?.map((c) => (c.id === card.id ? { ...c, front: val } : c)) || null
                            );
                          }}
                          className="w-full bg-[#161311] border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                        />
                      </div>

                      {/* Editable Back */}
                      <div>
                        <label className="text-[10px] uppercase font-mono text-stone-500 block mb-0.5">
                          Answer / Definition (Back)
                        </label>
                        <textarea
                          rows={2}
                          value={card.back}
                          onChange={(e) => {
                            const val = e.target.value;
                            setGeneratedCardsPreview((prev) =>
                              prev?.map((c) => (c.id === card.id ? { ...c, back: val } : c)) || null
                            );
                          }}
                          className="w-full bg-[#161311] border border-stone-800 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50 leading-relaxed font-sans"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Finalize Action */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setGeneratedCardsPreview(null)}
                    className="text-xs text-stone-400 hover:text-stone-200"
                  >
                    ← Back to Configure
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalizeSaveGeneratedCards}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    <span>
                      {aiDeckMode === 'create_deck'
                        ? `Create Deck "${generatedCardsPreview[0]?.subject}" (${generatedCardsPreview.length} Cards)`
                        : `Add ${generatedCardsPreview.length} Cards to "${generatedCardsPreview[0]?.subject}"`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
