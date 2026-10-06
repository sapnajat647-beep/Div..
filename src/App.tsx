import React, { useState, useEffect } from 'react';
import { NavTab, Note, FlashcardItem, StudyStats } from './types';
import {
  getStoredNotes,
  saveStoredNotes,
  getStoredFlashcards,
  saveStoredFlashcards,
  getStoredStats,
  recordCompletedSession,
  recordFlashcardsReviewed,
  recordQuestionsSolved,
  recordNoteCreated,
  updateDailyGoal
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { HomeOverview } from './components/HomeOverview';
import { DeepFocus } from './components/DeepFocus';
import { NotesManager } from './components/NotesManager';
import { AIQuestionGeneratorFlow } from './components/AIQuestionGeneratorFlow';
import { FlashcardsDeck } from './components/FlashcardsDeck';
import { MyProgressDashboard } from './components/MyProgressDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [notes, setNotes] = useState<Note[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [stats, setStats] = useState<StudyStats>(getStoredStats());
  const [prefilledNoteForQuiz, setPrefilledNoteForQuiz] = useState<Note | null>(null);

  // Initialize data from local storage
  useEffect(() => {
    setNotes(getStoredNotes());
    setFlashcards(getStoredFlashcards());
    setStats(getStoredStats());
  }, []);

  const handleSaveNotes = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    saveStoredNotes(updatedNotes);
  };

  const handleSaveFlashcards = (updatedCards: FlashcardItem[]) => {
    setFlashcards(updatedCards);
    saveStoredFlashcards(updatedCards);
  };

  const handleRecordFocusSession = (minutes: number, subject?: string) => {
    const updated = recordCompletedSession(minutes, subject);
    setStats(updated);
  };

  const handleRecordFlashcardsReviewed = (count: number, subject?: string) => {
    const updated = recordFlashcardsReviewed(count, subject);
    setStats(updated);
  };

  const handleRecordQuestionsSolved = (count: number, subject?: string) => {
    const updated = recordQuestionsSolved(count, subject);
    setStats(updated);
  };

  const handleRecordNoteCreated = (title: string, subject?: string) => {
    const updated = recordNoteCreated(title, subject);
    setStats(updated);
  };

  const handleUpdateDailyGoal = (minutes: number) => {
    const updated = updateDailyGoal(minutes);
    setStats(updated);
  };

  const handleOpenNoteForQuiz = (note: Note) => {
    setPrefilledNoteForQuiz(note);
    setActiveTab('generator');
  };

  const handleConvertNoteToFlashcards = (note: Note) => {
    // Generate starter active recall cards from note headings or content
    const lines = note.content.split('\n');
    const questions: string[] = [];
    lines.forEach((l) => {
      if (l.trim().endsWith('?')) {
        questions.push(l.replace(/^[-*#0-9.]+\s*/, '').trim());
      }
    });

    const newCards: FlashcardItem[] = questions.slice(0, 3).map((q, idx) => ({
      id: `fc-note-${Date.now()}-${idx}`,
      front: q,
      back: `Reference Note: ${note.title}\n\nReview your full notes for complete synthesis.`,
      subject: note.subject,
      sourceNoteId: note.id,
      masteryLevel: 'learning',
    }));

    if (newCards.length === 0) {
      newCards.push({
        id: `fc-note-${Date.now()}`,
        front: `What are the core principles outlined in "${note.title}"?`,
        back: note.content.slice(0, 300) + '...',
        subject: note.subject,
        sourceNoteId: note.id,
        masteryLevel: 'unseen',
      });
    }

    const updated = [...newCards, ...flashcards];
    handleSaveFlashcards(updated);
    alert(`Created ${newCards.length} flashcards from "${note.title}"!`);
    setActiveTab('flashcards');
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] text-stone-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* 3-zone Header Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        streakDays={stats.streakDays}
        totalMinutes={stats.totalMinutes}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'home' && (
          <HomeOverview
            onSelectTab={setActiveTab}
            onOpenNoteForQuiz={handleOpenNoteForQuiz}
            notes={notes}
            stats={stats}
          />
        )}

        {activeTab === 'focus' && (
          <DeepFocus
            onBackToHome={() => setActiveTab('home')}
            stats={stats}
            onRecordSession={handleRecordFocusSession}
          />
        )}

        {activeTab === 'notes' && (
          <NotesManager
            notes={notes}
            onSaveNotes={handleSaveNotes}
            onOpenNoteForQuiz={handleOpenNoteForQuiz}
            onConvertNoteToFlashcards={handleConvertNoteToFlashcards}
            onRecordNoteCreated={handleRecordNoteCreated}
          />
        )}

        {activeTab === 'generator' && (
          <AIQuestionGeneratorFlow
            onBackToHome={() => setActiveTab('home')}
            onRecordQuestionsSolved={handleRecordQuestionsSolved}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardsDeck
            cards={flashcards}
            notes={notes}
            onSaveCards={handleSaveFlashcards}
            onNavigateToGenerator={() => setActiveTab('generator')}
            onRecordFlashcardReview={handleRecordFlashcardsReviewed}
          />
        )}

        {activeTab === 'progress' && (
          <MyProgressDashboard
            stats={stats}
            onSelectTab={setActiveTab}
            onUpdateDailyGoal={handleUpdateDailyGoal}
          />
        )}
      </main>

      {/* Quiet Academic Footer */}
      <footer className="mt-auto border-t border-stone-800/80 bg-[#0e0c0b] py-8 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-stone-300">StudySpace</span>
            <span>·</span>
            <span>Synthesizing Deep Focus, Structured Notes & Active Recall</span>
          </div>

          <div className="flex items-center gap-4 text-stone-400">
            <button
              onClick={() => setActiveTab('focus')}
              className="hover:text-amber-300 transition-colors"
            >
              Focus Timer
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className="hover:text-amber-300 transition-colors"
            >
              Notes
            </button>
            <button
              onClick={() => setActiveTab('generator')}
              className="hover:text-amber-300 transition-colors"
            >
              AI Quiz
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className="hover:text-amber-300 transition-colors"
            >
              Flashcards
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className="hover:text-amber-300 transition-colors"
            >
              My Progress
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
