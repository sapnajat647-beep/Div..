import React, { useState } from 'react';
import { Note, NoteSummaryResult } from '../types';
import {
  Plus,
  Search,
  BookOpen,
  Pin,
  Trash2,
  Brain,
  Sparkles,
  Download,
  Copy,
  Tag,
  Folder,
  Layers,
  Edit3,
  Eye,
  Check,
  ArrowLeft
} from 'lucide-react';
import { SummaryModal } from './SummaryModal';
import { DigitalNotebook } from './DigitalNotebook';

interface NotesManagerProps {
  notes: Note[];
  onSaveNotes: (notes: Note[]) => void;
  onOpenNoteForQuiz: (note: Note) => void;
  onConvertNoteToFlashcards: (note: Note) => void;
  onRecordNoteCreated?: (title: string, subject?: string) => void;
}

export const NotesManager: React.FC<NotesManagerProps> = ({
  notes,
  onSaveNotes,
  onOpenNoteForQuiz,
  onConvertNoteToFlashcards,
  onRecordNoteCreated,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string>(notes[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('editor');

  // AI Summary State
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryData, setSummaryData] = useState<NoteSummaryResult | null>(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Derive unique subjects from notes
  const subjects = ['all', ...Array.from(new Set(notes.map((n) => n.subject)))];

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || notes[0];

  // Filtering
  const filteredNotes = notes
    .filter((n) => {
      const matchesSubject =
        selectedSubject === 'all' || n.subject.toLowerCase() === selectedSubject.toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesQuery =
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query) ||
        n.tags.some((t) => t.toLowerCase().includes(query));
      return matchesSubject && matchesQuery;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });

  const handleCreateNewNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'Untitled Study Notes',
      subject: selectedSubject !== 'all' ? selectedSubject : 'General Studies',
      tags: ['StudyNotes'],
      paperStyle: 'ruled',
      content: `# Untitled Study Notes\n\nWrite your concepts, definitions, and active recall queries here...\n\n## Key Concept 1\n- Core definition:\n- Important formula or rule:\n\n## Self-Testing Questions\n- What is the key mechanism?`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
    };
    const updated = [newNote, ...notes];
    onSaveNotes(updated);
    if (onRecordNoteCreated) {
      onRecordNoteCreated(newNote.title, newNote.subject);
    }
    setSelectedNoteId(newNote.id);
    setMobileView('editor');
  };

  const handleUpdateNote = (fields: Partial<Note>) => {
    if (!selectedNote) return;
    const updated = notes.map((n) =>
      n.id === selectedNote.id ? { ...n, ...fields, updatedAt: Date.now() } : n
    );
    onSaveNotes(updated);
  };

  const handleDeleteNote = (id: string) => {
    if (notes.length <= 1) {
      alert('You must have at least one study note.');
      return;
    }
    const updated = notes.filter((n) => n.id !== id);
    onSaveNotes(updated);
    if (selectedNoteId === id) {
      setSelectedNoteId(updated[0]?.id || '');
    }
  };

  const handleTogglePin = (id: string) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, isPinned: !n.isPinned } : n
    );
    onSaveNotes(updated);
  };

  // AI Summarize handler
  const handleAISummarize = async () => {
    if (!selectedNote) return;
    setIsSummarizing(true);
    setSummaryError(null);

    try {
      const res = await fetch('/api/gemini/summarize-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedNote.title,
          content: selectedNote.content,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || 'AI is temporarily busy. Please try again in a moment.');
      }

      const data: NoteSummaryResult = await res.json();
      setSummaryData(data);
      setSummaryModalOpen(true);
    } catch (err: any) {
      console.error(err);
      setSummaryError(err.message || 'Error communicating with AI tutor.');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-stone-100 flex items-center gap-2.5">
            <BookOpen className="h-7 w-7 text-amber-400" />
            <span>Digital Study Notebook</span>
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Real digital paper, touch writing &amp; drawing pens, highlighters, and instant AI quizzes.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Mobile switcher */}
          <div className="flex sm:hidden items-center p-1 bg-[#12100e] border border-stone-800 rounded-xl text-xs">
            <button
              onClick={() => setMobileView('list')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                mobileView === 'list'
                  ? 'bg-amber-400 text-stone-950 font-semibold'
                  : 'text-stone-400'
              }`}
            >
              Notes ({notes.length})
            </button>
            <button
              onClick={() => setMobileView('editor')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                mobileView === 'editor'
                  ? 'bg-amber-400 text-stone-950 font-semibold'
                  : 'text-stone-400'
              }`}
            >
              Notebook
            </button>
          </div>

          <button
            onClick={handleCreateNewNote}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Main split workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Note Navigator (visible on desktop or when mobileView === 'list') */}
        <div
          className={`space-y-4 lg:col-span-4 ${
            mobileView === 'list' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 h-4 w-4 text-stone-500 top-3" />
            <input
              type="text"
              placeholder="Search title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161311] border border-stone-800 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Subject segmented buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap capitalize transition-colors font-medium ${
                  selectedSubject === sub
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-stone-900/60 text-stone-400 hover:bg-stone-800 hover:text-stone-200 border border-stone-800/80'
                }`}
              >
                {sub === 'all' ? 'All' : sub}
              </button>
            ))}
          </div>

          {/* Notes list */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredNotes.length === 0 ? (
              <div className="rounded-xl border border-stone-800 bg-[#161311] p-8 text-center text-xs text-stone-500">
                No matching study notes found.
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = selectedNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      setMobileView('editor');
                    }}
                    className={`group cursor-pointer rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'border-amber-500/50 bg-[#1f1a17] shadow-md shadow-amber-950/20'
                        : 'border-stone-800/80 bg-[#151210] hover:bg-[#1a1614] hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-semibold text-amber-400">{note.subject}</span>
                          <span className="text-stone-600">·</span>
                          <span className="font-mono-numbers text-stone-500">
                            {new Date(note.updatedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <h3
                          className={`text-sm font-semibold line-clamp-1 ${
                            isSelected ? 'text-stone-100' : 'text-stone-300'
                          }`}
                        >
                          {note.title || 'Untitled Note'}
                        </h3>
                        <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                          {note.content.replace(/[#*`_]/g, '')}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePin(note.id);
                        }}
                        className={`p-1 rounded hover:bg-stone-800 transition-colors ${
                          note.isPinned ? 'text-amber-400' : 'text-stone-600 group-hover:text-stone-400'
                        }`}
                        title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Paper style badge preview */}
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-stone-800/60 text-[10px] text-stone-500">
                      <span className="capitalize font-mono">
                        📄 {note.paperStyle ? note.paperStyle.replace('-', ' ') : 'ruled'} paper
                      </span>
                      {note.drawingData && (
                        <span className="text-amber-400 font-mono">✍️ Has sketches</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Digital Notebook Workspace (8 cols on desktop or when mobileView === 'editor') */}
        <div
          className={`space-y-4 lg:col-span-8 ${
            mobileView === 'editor' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Mobile Back to List button */}
          <div className="lg:hidden flex items-center justify-between pb-1">
            <button
              onClick={() => setMobileView('list')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-300 bg-stone-900 border border-stone-800 rounded-lg"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Notes List</span>
            </button>

            <span className="text-xs font-mono text-stone-400 truncate max-w-[180px]">
              {selectedNote?.title}
            </span>
          </div>

          {selectedNote ? (
            <DigitalNotebook
              note={selectedNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onOpenNoteForQuiz={onOpenNoteForQuiz}
              onSummarizeNote={handleAISummarize}
              isSummarizing={isSummarizing}
            />
          ) : (
            <div className="rounded-2xl border border-stone-800 bg-[#161311] p-12 text-center text-stone-500">
              Select or create a study note to start writing.
            </div>
          )}
        </div>
      </div>

      {/* Cognitive Summary Modal */}
      <SummaryModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        summaryData={summaryData}
        noteTitle={selectedNote?.title || 'Study Note'}
      />
    </div>
  );
};

