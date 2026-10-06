import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { soundSynth } from '../utils/audioSynthesizer';
import { AmbientSoundType, StudyStats } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  CloudRain,
  Trees,
  Coffee,
  Radio,
  VolumeX,
  Volume2,
  Sparkles,
  CheckCircle2,
  Target,
  ArrowLeft,
  Flame,
  Clock
} from 'lucide-react';

interface DeepFocusProps {
  onBackToHome: () => void;
  stats: StudyStats;
  onRecordSession: (minutes: number) => void;
}

const FOCUS_TIPS = [
  'Keep your phone in another room to prevent subconscious notification checks.',
  'When your mind wanders, gently note the thought on scratch paper and return to your anchor task.',
  'Active retrieval during breaks: summarize the last 25 minutes from memory.',
  'Hydrate with water between sessions; even 2% dehydration impairs cognitive executive function.',
  'Use 40Hz Gamma binaural audio to elevate gamma wave synchronization during complex problem solving.'
];

export const DeepFocus: React.FC<DeepFocusProps> = ({
  onBackToHome,
  stats,
  onRecordSession,
}) => {
  const [initialMinutes, setInitialMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [taskAnchor, setTaskAnchor] = useState('');
  const [isZenMode, setIsZenMode] = useState(false);
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>(soundSynth.getCurrentSound());
  const [volume, setVolume] = useState(soundSynth.getVolume());
  const [tipIndex, setTipIndex] = useState(0);
  const [completedNotification, setCompletedNotification] = useState<string | null>(null);
  const [isCustomTimerOpen, setIsCustomTimerOpen] = useState(false);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('30');

  const timerRef = useRef<number | null>(null);

  // Timer interval loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, initialMinutes, mode]);

  // Rotate tips periodically
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % FOCUS_TIPS.length);
    }, 15000);
    return () => clearInterval(tipInterval);
  }, []);

  const handleSessionComplete = () => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Play procedural singing bowl chime
    soundSynth.playCompletionChime();

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#d97706', '#fbbf24', '#fef3c7']
      });
    } catch {
      // ignore
    }

    if (mode === 'focus') {
      onRecordSession(initialMinutes);
      setCompletedNotification(`🎉 Outstanding focus! Completed ${initialMinutes} minutes on "${taskAnchor || 'Deep Work'}". Time for a quick break!`);
    } else {
      setCompletedNotification('🌱 Break completed! Ready to dive back into deep focus?');
    }
  };

  const setTimerPreset = (minutes: number, sessionMode: 'focus' | 'break' = 'focus') => {
    setIsRunning(false);
    setInitialMinutes(minutes);
    setSecondsRemaining(minutes * 60);
    setMode(sessionMode);
    setCompletedNotification(null);
  };

  const handleStart = () => {
    setCompletedNotification(null);
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsRemaining(initialMinutes * 60);
    setCompletedNotification(null);
  };

  const handleSoundChange = (type: AmbientSoundType) => {
    soundSynth.playSound(type);
    setAmbientSound(type);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundSynth.setVolume(val);
  };

  // Time calculations
  const totalSeconds = initialMinutes * 60;
  const progressFraction = totalSeconds > 0 ? (totalSeconds - secondsRemaining) / totalSeconds : 0;
  const minutesDisplay = Math.floor(secondsRemaining / 60);
  const secondsDisplay = secondsRemaining % 60;
  const formattedTime = `${minutesDisplay.toString().padStart(2, '0')}:${secondsDisplay.toString().padStart(2, '0')}`;

  // SVG circular geometry
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressFraction * circumference;

  return (
    <div className={`transition-all duration-500 ${isZenMode ? 'fixed inset-0 z-50 bg-[#0a0908] p-6 flex flex-col justify-between overflow-y-auto' : 'max-w-4xl mx-auto space-y-8 pb-16'}`}>
      {/* Top Header bar inside Focus */}
      <div className="flex items-center justify-between">
        <button
          onClick={isZenMode ? () => setIsZenMode(false) : onBackToHome}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-stone-400 hover:text-stone-200 bg-stone-900/80 hover:bg-stone-800 border border-stone-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{isZenMode ? 'Exit Zen Mode' : 'Back to Home'}</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsZenMode(!isZenMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800 rounded-lg transition-colors"
            title="Toggle Zen Fullscreen Mode"
          >
            {isZenMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isZenMode ? 'Standard Mode' : 'Zen View'}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="text-center space-y-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-stone-100">
            {mode === 'focus' ? 'Deep Focus' : 'Mindful Rest'}
          </h1>
          <p className="text-sm text-stone-400 mt-1 max-w-md mx-auto">
            {mode === 'focus'
              ? 'Put distractions away. Single-task on your most essential objective.'
              : 'Step away from the screen, stretch, breathe, and let your brain consolidate knowledge.'}
          </p>
        </div>

        {/* Task Anchor Input */}
        <div className="max-w-md mx-auto">
          <div className="relative flex items-center">
            <Target className="absolute left-3.5 h-4 w-4 text-amber-500" />
            <input
              type="text"
              placeholder="What are you studying right now?"
              value={taskAnchor}
              onChange={(e) => setTaskAnchor(e.target.value)}
              className="w-full bg-[#181513] border border-stone-800 focus:border-amber-500/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition-colors"
            />
          </div>
        </div>

        {/* Preset Duration Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setTimerPreset(25, 'focus')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              initialMinutes === 25 && mode === 'focus'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'bg-stone-900/80 text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            25 min (Pomodoro)
          </button>
          <button
            onClick={() => setTimerPreset(50, 'focus')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              initialMinutes === 50 && mode === 'focus'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'bg-stone-900/80 text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            50 min (Deep Flow)
          </button>
          <button
            onClick={() => setTimerPreset(5, 'break')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              initialMinutes === 5 && mode === 'break'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-stone-900/80 text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            5 min (Short Break)
          </button>
          <button
            onClick={() => setTimerPreset(15, 'break')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              initialMinutes === 15 && mode === 'break'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-stone-900/80 text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            15 min (Long Break)
          </button>
          <button
            onClick={() => setIsCustomTimerOpen(!isCustomTimerOpen)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              isCustomTimerOpen
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-stone-900/80 text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            Custom ⏱️
          </button>
        </div>

        {/* Custom Timer Input Popover */}
        {isCustomTimerOpen && (
          <div className="max-w-xs mx-auto p-3 rounded-2xl border border-stone-800 bg-[#171412] flex items-center justify-center gap-2 animate-fade-in shadow-xl">
            <span className="text-xs text-stone-400">Duration:</span>
            <input
              type="number"
              min="1"
              max="180"
              value={customMinutesInput}
              onChange={(e) => setCustomMinutesInput(e.target.value)}
              className="w-16 bg-[#12100e] border border-stone-700 text-stone-100 rounded-lg px-2.5 py-1 text-xs text-center font-mono focus:outline-none focus:border-amber-500"
            />
            <span className="text-xs text-stone-400">min</span>
            <button
              onClick={() => {
                const mins = parseInt(customMinutesInput) || 25;
                const safeMins = Math.max(1, Math.min(180, mins));
                setTimerPreset(safeMins, 'focus');
                setIsCustomTimerOpen(false);
              }}
              className="px-3 py-1 bg-amber-400 text-stone-950 font-bold text-xs rounded-lg hover:bg-amber-300 transition-colors"
            >
              Set
            </button>
          </div>
        )}

        {/* Circular SVG Timer Progress Ring */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 280 280">
            {/* Background ring */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              className="text-stone-900 stroke-current"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Animated progress ring */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              className={`stroke-current transition-all duration-1000 ease-linear ${
                mode === 'focus' ? 'text-amber-500' : 'text-emerald-500'
              }`}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-[#171412]/90 border border-stone-800 shadow-2xl m-4">
            <span className="text-xs uppercase font-mono tracking-widest text-stone-500 mb-1">
              {mode === 'focus' ? (isRunning ? 'In Flow' : 'Ready') : 'Resting'}
            </span>
            <div className="font-mono-numbers text-5xl sm:text-6xl font-bold tracking-tight text-stone-100 select-none">
              {formattedTime}
            </div>
            {taskAnchor && (
              <span className="text-xs text-amber-300/90 max-w-[190px] truncate mt-2 font-medium">
                {taskAnchor}
              </span>
            )}
          </div>
        </div>

        {/* Notification Banner on Session Finish */}
        {completedNotification && (
          <div className="max-w-md mx-auto rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-xs text-amber-200 flex items-center gap-3 text-left">
            <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />
            <div className="flex-1">{completedNotification}</div>
          </div>
        )}

        {/* Primary Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              <Play className="h-4 w-4 fill-stone-950" />
              <span>Start</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-stone-100 bg-stone-800 hover:bg-stone-700 active:scale-95 rounded-xl border border-stone-700 transition-all shadow-md"
            >
              <Pause className="h-4 w-4 fill-stone-100" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-stone-400 hover:text-stone-200 bg-stone-900/80 hover:bg-stone-800 active:scale-95 rounded-xl border border-stone-800 transition-all"
            title="Reset timer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>
        </div>

        {/* Ambient Soundscape selector bar inside Deep Focus */}
        <div className="max-w-lg mx-auto rounded-2xl border border-stone-800/80 bg-[#161311] p-4 text-left">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-stone-300 flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Ambient Focus Soundscape</span>
            </span>
            <span className="text-[11px] text-stone-500 font-mono">Synthesized Procedural Audio</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { type: 'none' as AmbientSoundType, label: 'Silent', icon: VolumeX },
              { type: 'rain' as AmbientSoundType, label: 'Rain', icon: CloudRain },
              { type: 'forest' as AmbientSoundType, label: 'Forest', icon: Trees },
              { type: 'cafe' as AmbientSoundType, label: 'Cafe', icon: Coffee },
              { type: 'binaural' as AmbientSoundType, label: '40Hz Wave', icon: Radio },
            ].map((sound) => {
              const Icon = sound.icon;
              const isActive = ambientSound === sound.type;
              return (
                <button
                  key={sound.type}
                  onClick={() => handleSoundChange(sound.type)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-medium border transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:bg-stone-800 hover:text-stone-200'
                  }`}
                >
                  <Icon className="h-4 w-4 mb-1" />
                  <span className="text-[11px]">{sound.label}</span>
                </button>
              );
            })}
          </div>

          {ambientSound !== 'none' && (
            <div className="mt-3 pt-3 border-t border-stone-800/80 flex items-center gap-3">
              <span className="text-[11px] text-stone-400 shrink-0">Volume</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] font-mono-numbers text-stone-400 shrink-0">
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Stats Row (Sessions, Minutes from User Brief) */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 py-3 border-y border-stone-800/80 max-w-md mx-auto text-center font-mono-numbers">
          <div>
            <strong className="block text-2xl font-bold text-stone-100">{stats.totalSessions}</strong>
            <span className="text-xs text-stone-400">Total Sessions</span>
          </div>
          <div className="h-8 w-px bg-stone-800" />
          <div>
            <strong className="block text-2xl font-bold text-stone-100">{stats.totalMinutes}</strong>
            <span className="text-xs text-stone-400">Minutes Studied</span>
          </div>
          <div className="h-8 w-px bg-stone-800" />
          <div>
            <strong className="block text-2xl font-bold text-amber-400">{stats.streakDays}d</strong>
            <span className="text-xs text-stone-400">Daily Streak</span>
          </div>
        </div>

        {/* Dynamic Focus Tip */}
        <div className="max-w-lg mx-auto rounded-xl border border-stone-800/60 bg-[#141210] p-3 text-xs text-stone-400 flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-stone-300">Focus Tip:</strong> {FOCUS_TIPS[tipIndex]}
          </span>
        </div>

        {/* Focus Session History */}
        <div className="max-w-lg mx-auto rounded-2xl border border-stone-800/80 bg-[#161311] p-4 text-left space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-stone-800/80 pb-2">
            <span className="font-semibold text-stone-300 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>Recent Focus Sessions</span>
            </span>
            <span className="text-[11px] text-stone-500 font-mono">
              {stats.history.length} logged days
            </span>
          </div>

          <div className="space-y-2">
            {stats.history.slice(-3).reverse().map((h, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-[#12100e] border border-stone-800/60 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-stone-200 font-medium">
                    {h.date === new Date().toISOString().split('T')[0] ? "Today's Deep Focus" : h.date}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono-numbers">
                  <span className="text-stone-400 text-[11px]">{h.sessions} sessions</span>
                  <span className="text-amber-400 font-bold">{h.minutes}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
