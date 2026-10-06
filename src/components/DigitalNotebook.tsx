import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Note, PaperStyle, PenStyle } from '../types';
import {
  FileText,
  PenTool,
  Palette,
  Sliders,
  Highlighter as HighlighterIcon,
  Eraser,
  Undo2,
  Redo2,
  Type as TypeIcon,
  Sparkles,
  Brain,
  Download,
  Trash2,
  Check,
  ChevronDown,
  Layers
} from 'lucide-react';

interface DigitalNotebookProps {
  note: Note;
  onUpdateNote: (fields: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onOpenNoteForQuiz: (note: Note) => void;
  onSummarizeNote: () => void;
  isSummarizing: boolean;
}

const PAPER_STYLES: { id: PaperStyle; label: string; previewBg: string; textColor: string }[] = [
  { id: 'plain-white', label: 'Plain White', previewBg: 'bg-white', textColor: 'text-stone-900' },
  { id: 'ruled', label: 'Ruled / Lined', previewBg: 'bg-white', textColor: 'text-stone-900' },
  { id: 'grid', label: 'Grid Paper', previewBg: 'bg-white', textColor: 'text-stone-900' },
  { id: 'dotted', label: 'Dotted Paper', previewBg: 'bg-stone-50', textColor: 'text-stone-900' },
  { id: 'dark', label: 'Dark Paper', previewBg: 'bg-[#181513]', textColor: 'text-stone-100' },
  { id: 'cream', label: 'Cream Paper', previewBg: 'bg-[#f7f2e7]', textColor: 'text-amber-950' },
];

const PEN_STYLES: { id: PenStyle; label: string; defaultSize: number; defaultOpacity: number }[] = [
  { id: 'ballpoint', label: 'Ballpoint', defaultSize: 2.5, defaultOpacity: 0.9 },
  { id: 'gel', label: 'Gel Pen', defaultSize: 3.5, defaultOpacity: 1.0 },
  { id: 'fineliner', label: 'Fine Liner', defaultSize: 1.5, defaultOpacity: 0.95 },
  { id: 'highlighter', label: 'Highlighter', defaultSize: 24, defaultOpacity: 0.35 },
  { id: 'pencil', label: 'Pencil', defaultSize: 2.0, defaultOpacity: 0.65 },
];

const LIGHT_COLORS = [
  '#1c1917', // Ink Black
  '#1e3a8a', // Deep Blue
  '#b91c1c', // Ruby Red
  '#15803d', // Pine Green
  '#78350f', // Warm Brown
  '#6b21a8', // Royal Purple
];

const DARK_COLORS = [
  '#fafaf9', // Chalk White
  '#fde047', // Warm Gold
  '#38bdf8', // Electric Cyan
  '#f87171', // Coral Red
  '#4ade80', // Mint Green
  '#c084fc', // Lavender
];

const HIGHLIGHT_COLORS = [
  '#fde047', // Fluorescent Yellow
  '#86efac', // Soft Green
  '#fca5a5', // Pastel Peach
  '#7dd3fc', // Sky Blue
  '#d8b4fe', // Lilac
];

const SIZES = [1.5, 3, 6, 12, 24];

export const DigitalNotebook: React.FC<DigitalNotebookProps> = ({
  note,
  onUpdateNote,
  onDeleteNote,
  onOpenNoteForQuiz,
  onSummarizeNote,
  isSummarizing,
}) => {
  // Mode: 'type' or 'draw'
  const [activeMode, setActiveMode] = useState<'type' | 'draw'>('type');

  // Notebook Style States
  const currentPaper: PaperStyle = note.paperStyle || 'ruled';
  const [penStyle, setPenStyle] = useState<PenStyle>('gel');
  const [penColor, setPenColor] = useState<string>(currentPaper === 'dark' ? '#fafaf9' : '#1c1917');
  const [penSize, setPenSize] = useState<number>(3);
  const [isEraserActive, setIsEraserActive] = useState<boolean>(false);

  // Popover Toggles
  const [openMenu, setOpenMenu] = useState<'paper' | 'pen' | 'color' | 'size' | null>(null);

  // Title Editing State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(note.title);

  // Canvas Refs & History
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // Keep title input in sync
  useEffect(() => {
    setTitleInput(note.title);
  }, [note.title]);

  // Adjust default ink color when paper style changes
  const handleSelectPaper = (styleId: PaperStyle) => {
    onUpdateNote({ paperStyle: styleId });
    setOpenMenu(null);
    if (styleId === 'dark' && penColor === '#1c1917') {
      setPenColor('#fafaf9');
    } else if (styleId !== 'dark' && penColor === '#fafaf9') {
      setPenColor('#1c1917');
    }
  };

  const handleSelectPen = (pId: PenStyle) => {
    setPenStyle(pId);
    setIsEraserActive(false);
    const found = PEN_STYLES.find((p) => p.id === pId);
    if (found) {
      setPenSize(found.defaultSize);
    }
    setOpenMenu(null);
  };

  const handleSelectHighlighter = () => {
    setPenStyle('highlighter');
    setIsEraserActive(false);
    setPenSize(24);
    if (!HIGHLIGHT_COLORS.includes(penColor)) {
      setPenColor(HIGHLIGHT_COLORS[0]);
    }
    setOpenMenu(null);
  };

  const handleToggleEraser = () => {
    setIsEraserActive((prev) => !prev);
    setOpenMenu(null);
  };

  // Canvas sizing and loading saved drawing
  const syncCanvasSizeAndData = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const width = Math.max(300, rect.width);
    const height = Math.max(550, rect.height);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;

      // Restore drawing if available
      if (note.drawingData) {
        const img = new Image();
        img.onload = () => {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0);
            saveHistorySnapshot();
          }
        };
        img.src = note.drawingData;
      } else {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          saveHistorySnapshot();
        }
      }
    }
  }, [note.drawingData]);

  useEffect(() => {
    syncCanvasSizeAndData();
    window.addEventListener('resize', syncCanvasSizeAndData);
    return () => window.removeEventListener('resize', syncCanvasSizeAndData);
  }, [syncCanvasSizeAndData, note.id]);

  // Save canvas state for Undo / Redo
  const saveHistorySnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // Trim forward redo history
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(data);
    if (historyRef.current.length > 20) {
      historyRef.current.shift();
    }
    historyIndexRef.current = historyRef.current.length - 1;
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
      onUpdateNote({ drawingData: canvas.toDataURL() });
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
      onUpdateNote({ drawingData: canvas.toDataURL() });
    }
  };

  // Drawing event handlers with touch optimization
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (activeMode !== 'draw') return;
    isDrawingRef.current = true;
    const pt = getCoordinates(e);
    lastPointRef.current = pt;
  };

  const drawStroke = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || activeMode !== 'draw') return;
    if ('touches' in e && e.cancelable) {
      e.preventDefault(); // prevent scrolling while drawing on touchscreen
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPt = getCoordinates(e);
    const lastPt = lastPointRef.current || currentPt;

    ctx.beginPath();
    ctx.moveTo(lastPt.x, lastPt.y);
    ctx.lineTo(currentPt.x, currentPt.y);

    if (isEraserActive) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = Math.max(16, penSize * 3);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    } else {
      ctx.globalCompositeOperation = penStyle === 'highlighter' ? 'multiply' : 'source-over';
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
      ctx.lineCap = penStyle === 'highlighter' ? 'square' : 'round';
      ctx.lineJoin = 'round';

      if (penStyle === 'pencil') {
        ctx.globalAlpha = 0.65;
      } else if (penStyle === 'highlighter') {
        ctx.globalAlpha = 0.35;
      } else {
        ctx.globalAlpha = 0.95;
      }

      ctx.stroke();
    }

    lastPointRef.current = currentPt;
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;

    saveHistorySnapshot();

    const canvas = canvasRef.current;
    if (canvas) {
      onUpdateNote({ drawingData: canvas.toDataURL() });
    }
  };

  // Helper for background paper textures
  const getPaperStyles = (): React.CSSProperties => {
    switch (currentPaper) {
      case 'ruled':
        return {
          backgroundColor: '#ffffff',
          color: '#1c1917',
          backgroundImage:
            'repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px)',
          lineHeight: '32px',
        };
      case 'grid':
        return {
          backgroundColor: '#ffffff',
          color: '#1c1917',
          backgroundImage:
            'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        };
      case 'dotted':
        return {
          backgroundColor: '#fafaf9',
          color: '#1c1917',
          backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
          backgroundSize: '20px 20px',
        };
      case 'dark':
        return {
          backgroundColor: '#181513',
          color: '#f5f5f4',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        };
      case 'cream':
        return {
          backgroundColor: '#f7f2e7',
          color: '#292524',
          backgroundImage:
            'repeating-linear-gradient(transparent, transparent 31px, rgba(120,53,15,0.09) 31px, rgba(120,53,15,0.09) 32px)',
          lineHeight: '32px',
        };
      case 'plain-white':
      default:
        return {
          backgroundColor: '#ffffff',
          color: '#1c1917',
        };
    }
  };

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      onUpdateNote({ title: titleInput.trim() });
    }
    setIsEditingTitle(false);
  };

  const activeColorPalette = currentPaper === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  return (
    <div className="space-y-4">
      {/* Top Controls & Action Bar */}
      <div className="rounded-2xl border border-stone-800 bg-[#161311] p-3 sm:p-4 shadow-xl space-y-3">
        {/* Title Bar with inline rename & AI Bridges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800/80">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5 flex-1 max-w-md">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                  autoFocus
                  className="bg-[#12100e] border border-stone-700 rounded-lg px-2.5 py-1 text-sm font-bold text-stone-100 focus:outline-none focus:border-amber-500/50 w-full"
                />
                <button
                  onClick={handleTitleSubmit}
                  className="p-1.5 bg-amber-400 text-stone-950 rounded-lg text-xs font-semibold"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center gap-2 text-left truncate hover:opacity-90 transition-opacity"
                title="Click to rename note"
              >
                <h2 className="font-display text-lg sm:text-xl font-bold text-stone-100 truncate">
                  {note.title || 'Untitled Note'}
                </h2>
                <span className="text-[11px] text-stone-500 group-hover:text-amber-400 underline font-mono">
                  Rename
                </span>
              </button>
            )}
          </div>

          {/* AI Bridges & Delete */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenNoteForQuiz(note)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-sm shadow-amber-500/20 active:scale-95 whitespace-nowrap"
            >
              <Brain className="h-3.5 w-3.5" />
              <span>Generate Quiz</span>
            </button>

            <button
              onClick={onSummarizeNote}
              disabled={isSummarizing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-300 bg-stone-900 hover:bg-stone-800 border border-stone-700/80 rounded-xl transition-all disabled:opacity-50 whitespace-nowrap"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>{isSummarizing ? 'Summarizing...' : 'AI Summary'}</span>
            </button>

            <button
              onClick={() => onDeleteNote(note.id)}
              className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg border border-stone-800 transition-colors"
              title="Delete Note"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* PRIMARY DIGITAL NOTEBOOK TOOLBAR */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          {/* Main Controls: Paper | Pen | Color | Size | Highlighter | Eraser | Undo | Redo */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            {/* 1. Paper Style Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'paper' ? null : 'paper')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                  openMenu === 'paper'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
                }`}
                title="Change Paper Style"
              >
                <FileText className="h-3.5 w-3.5 text-amber-400" />
                <span className="capitalize hidden sm:inline">{currentPaper.replace('-', ' ')}</span>
                <span className="sm:hidden">Paper</span>
                <ChevronDown className="h-3 w-3 text-stone-500" />
              </button>

              {openMenu === 'paper' && (
                <div className="absolute left-0 mt-2 w-48 rounded-xl border border-stone-800 bg-[#171412] p-2 shadow-2xl z-40 space-y-1">
                  <div className="px-2 py-1 text-[11px] font-mono text-stone-500 uppercase tracking-wider">
                    Paper Style
                  </div>
                  {PAPER_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => handleSelectPaper(style.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        currentPaper === style.id
                          ? 'bg-amber-500/20 text-amber-300 font-semibold'
                          : 'text-stone-300 hover:bg-stone-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-full border border-stone-600 ${style.previewBg}`} />
                        <span>{style.label}</span>
                      </div>
                      {currentPaper === style.id && <Check className="h-3.5 w-3.5 text-amber-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Pen Style Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(openMenu === 'pen' ? null : 'pen');
                  setIsEraserActive(false);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                  openMenu === 'pen' || (!isEraserActive && penStyle !== 'highlighter')
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
                }`}
                title="Pen Style"
              >
                <PenTool className="h-3.5 w-3.5 text-amber-400" />
                <span className="capitalize hidden sm:inline">{penStyle}</span>
                <span className="sm:hidden">Pen</span>
                <ChevronDown className="h-3 w-3 text-stone-500" />
              </button>

              {openMenu === 'pen' && (
                <div className="absolute left-0 mt-2 w-44 rounded-xl border border-stone-800 bg-[#171412] p-2 shadow-2xl z-40 space-y-1">
                  <div className="px-2 py-1 text-[11px] font-mono text-stone-500 uppercase tracking-wider">
                    Pen Type
                  </div>
                  {PEN_STYLES.map((pen) => (
                    <button
                      key={pen.id}
                      type="button"
                      onClick={() => handleSelectPen(pen.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        penStyle === pen.id && !isEraserActive
                          ? 'bg-amber-500/20 text-amber-300 font-semibold'
                          : 'text-stone-300 hover:bg-stone-800/80'
                      }`}
                    >
                      <span>{pen.label}</span>
                      {penStyle === pen.id && !isEraserActive && (
                        <Check className="h-3.5 w-3.5 text-amber-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Color Picker Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'color' ? null : 'color')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-800 bg-stone-900 text-stone-300 hover:bg-stone-800"
                title="Ink Color"
              >
                <span
                  className="h-3.5 w-3.5 rounded-full border border-stone-600 shadow-sm"
                  style={{ backgroundColor: penColor }}
                />
                <span className="hidden sm:inline">Color</span>
                <ChevronDown className="h-3 w-3 text-stone-500" />
              </button>

              {openMenu === 'color' && (
                <div className="absolute left-0 mt-2 w-52 rounded-xl border border-stone-800 bg-[#171412] p-3 shadow-2xl z-40 space-y-2">
                  <div className="text-[11px] font-mono text-stone-500 uppercase tracking-wider">
                    Ink Palette
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {activeColorPalette.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setPenColor(c);
                          setOpenMenu(null);
                        }}
                        className={`h-6 w-6 rounded-full border transition-transform ${
                          penColor === c
                            ? 'scale-110 border-amber-400 ring-2 ring-amber-500/30'
                            : 'border-stone-700 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  <div className="text-[11px] font-mono text-stone-500 uppercase tracking-wider pt-2 border-t border-stone-800">
                    Highlighters
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {HIGHLIGHT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setPenColor(c);
                          setPenStyle('highlighter');
                          setIsEraserActive(false);
                          setOpenMenu(null);
                        }}
                        className={`h-6 w-6 rounded-full border transition-transform ${
                          penColor === c && penStyle === 'highlighter'
                            ? 'scale-110 border-amber-400 ring-2 ring-amber-500/30'
                            : 'border-stone-700 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Pen Size Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'size' ? null : 'size')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-800 bg-stone-900 text-stone-300 hover:bg-stone-800"
                title="Pen Size"
              >
                <Sliders className="h-3.5 w-3.5 text-stone-400" />
                <span className="font-mono text-xs">{penSize}px</span>
                <ChevronDown className="h-3 w-3 text-stone-500" />
              </button>

              {openMenu === 'size' && (
                <div className="absolute left-0 mt-2 w-48 rounded-xl border border-stone-800 bg-[#171412] p-3 shadow-2xl z-40 space-y-2">
                  <div className="flex justify-between text-[11px] font-mono text-stone-400">
                    <span>Stroke Size</span>
                    <span>{penSize}px</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 py-1">
                    {SIZES.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          setPenSize(sz);
                          setOpenMenu(null);
                        }}
                        className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-colors ${
                          penSize === sz
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800'
                        }`}
                      >
                        <span
                          className="rounded-full bg-current"
                          style={{ width: Math.min(14, sz + 2), height: Math.min(14, sz + 2) }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Highlighter Quick Button */}
            <button
              type="button"
              onClick={handleSelectHighlighter}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all ${
                penStyle === 'highlighter' && !isEraserActive
                  ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-semibold'
                  : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
              }`}
              title="Highlighter Tool"
            >
              <HighlighterIcon className="h-3.5 w-3.5 text-yellow-400" />
              <span className="hidden sm:inline">Highlighter</span>
            </button>

            {/* 6. Eraser Button */}
            <button
              type="button"
              onClick={handleToggleEraser}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all ${
                isEraserActive
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-semibold'
                  : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
              }`}
              title="Eraser Tool"
            >
              <Eraser className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Eraser</span>
            </button>

            {/* 7. Undo */}
            <button
              type="button"
              onClick={handleUndo}
              className="p-1.5 rounded-lg border border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
              title="Undo Stroke"
            >
              <Undo2 className="h-4 w-4" />
            </button>

            {/* 8. Redo */}
            <button
              type="button"
              onClick={handleRedo}
              className="p-1.5 rounded-lg border border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
              title="Redo Stroke"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Switcher: Type vs Draw / Handwrite */}
          <div className="flex items-center gap-1 p-1 bg-[#12100e] border border-stone-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveMode('type');
                setOpenMenu(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeMode === 'type'
                  ? 'bg-amber-400 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <TypeIcon className="h-3.5 w-3.5" />
              <span>Type</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('draw');
                setOpenMenu(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeMode === 'draw'
                  ? 'bg-amber-400 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <PenTool className="h-3.5 w-3.5" />
              <span>Draw / Handwrite</span>
            </button>
          </div>
        </div>
      </div>

      {/* DIGITAL NOTEBOOK CANVAS & PAPER CONTAINER */}
      <div className="relative rounded-2xl shadow-2xl border border-stone-800/80 overflow-hidden min-h-[580px]">
        {/* Underlay Paper Background */}
        <div
          className="w-full min-h-[580px] p-6 sm:p-8 transition-colors duration-200"
          style={getPaperStyles()}
        >
          {/* Ruled red margin line if ruled paper */}
          {currentPaper === 'ruled' && (
            <div className="absolute top-0 bottom-0 left-8 sm:left-12 w-px bg-rose-300 pointer-events-none opacity-70" />
          )}

          {/* Text Area for Typing (when typing is active or visible) */}
          <textarea
            value={note.content}
            onChange={(e) => onUpdateNote({ content: e.target.value })}
            placeholder="Type your study notes, formulas, and concepts here..."
            className={`w-full min-h-[520px] bg-transparent resize-none focus:outline-none font-sans text-sm sm:text-base leading-relaxed ${
              currentPaper === 'ruled' || currentPaper === 'cream' ? 'pl-6 sm:pl-8' : ''
            } ${activeMode === 'draw' ? 'pointer-events-none select-none opacity-85' : 'pointer-events-auto'}`}
            style={{
              lineHeight: currentPaper === 'ruled' || currentPaper === 'cream' ? '32px' : '1.75',
              color: currentPaper === 'dark' ? '#f5f5f4' : '#1c1917',
            }}
          />
        </div>

        {/* Overlay Drawing Canvas for Hand-Drawing / Handwriting */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={drawStroke}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={drawStroke}
          onTouchEnd={stopDrawing}
          className={`absolute inset-0 w-full h-full ${
            activeMode === 'draw'
              ? 'pointer-events-auto cursor-crosshair touch-none'
              : 'pointer-events-none'
          }`}
        />

        {/* Touch Drawing Indicator floating badge on mobile */}
        {activeMode === 'draw' && (
          <div className="absolute bottom-3 right-3 bg-stone-900/90 backdrop-blur-md border border-stone-800 text-stone-300 px-3 py-1 rounded-full text-xs font-mono pointer-events-none shadow-lg flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Draw Mode: {isEraserActive ? 'Eraser' : penStyle}</span>
          </div>
        )}
      </div>
    </div>
  );
};
