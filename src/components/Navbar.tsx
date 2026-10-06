import React, { useState } from 'react';
import { NavTab, AmbientSoundType } from '../types';
import { soundSynth } from '../utils/audioSynthesizer';
import {
  Sparkles,
  Volume2,
  VolumeX,
  CloudRain,
  Trees,
  Coffee,
  Radio,
  Flame,
  Clock,
  BookOpen,
  Brain,
  Layers,
  BarChart2
} from 'lucide-react';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  streakDays: number;
  totalMinutes: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  streakDays,
  totalMinutes,
}) => {
  const [currentSound, setCurrentSound] = useState<AmbientSoundType>(soundSynth.getCurrentSound());
  const [soundMenuOpen, setSoundMenuOpen] = useState(false);
  const [volume, setVolume] = useState(soundSynth.getVolume());

  const handleSelectSound = (type: AmbientSoundType) => {
    soundSynth.playSound(type);
    setCurrentSound(type);
    setSoundMenuOpen(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundSynth.setVolume(val);
  };

  const soundOptions = [
    { type: 'none' as AmbientSoundType, label: 'Mute', icon: VolumeX },
    { type: 'rain' as AmbientSoundType, label: 'Gentle Rain', icon: CloudRain },
    { type: 'forest' as AmbientSoundType, label: 'Forest Breeze', icon: Trees },
    { type: 'cafe' as AmbientSoundType, label: 'Cozy Cafe', icon: Coffee },
    { type: 'binaural' as AmbientSoundType, label: '40Hz Gamma Focus', icon: Radio },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-800/80 bg-[#0c0a09]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:bg-amber-500/20 group-hover:border-amber-400 transition-colors shadow-sm shadow-amber-500/10">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-xl font-bold tracking-tight text-stone-100 group-hover:text-amber-200 transition-colors">
                StudySpace
              </span>
            </div>
          </button>

          {/* Quick study streak display */}
          <div className="hidden lg:flex items-center gap-2 pl-4 text-xs font-mono-numbers text-stone-400 border-l border-stone-800">
            <span className="flex items-center gap-1 text-amber-400">
              <Flame className="h-3.5 w-3.5 fill-amber-500/30" />
              <span>{streakDays}d streak</span>
            </span>
            <span className="text-stone-600">·</span>
            <span className="text-stone-400">{Math.floor(totalMinutes)}m total</span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single-line) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'home'
                ? 'bg-stone-800 text-stone-100 font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onSelectTab('focus')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'focus'
                ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Deep Focus</span>
          </button>
          <button
            onClick={() => onSelectTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'notes'
                ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>My Notes</span>
          </button>
          <button
            onClick={() => onSelectTab('generator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'generator'
                ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
            }`}
          >
            <Brain className="h-3.5 w-3.5" />
            <span>AI Question Generator</span>
          </button>
          <button
            onClick={() => onSelectTab('flashcards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'flashcards'
                ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Flashcards</span>
          </button>
          <button
            onClick={() => onSelectTab('progress')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'progress'
                ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>Progress</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions & Ambient Audio Bar */}
        <div className="flex items-center gap-3">
          {/* Ambient Sound Popover */}
          <div className="relative">
            <button
              onClick={() => setSoundMenuOpen(!soundMenuOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                currentSound !== 'none'
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 shadow-sm'
                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
              title="Ambient Focus Sounds"
            >
              {currentSound !== 'none' ? (
                <Volume2 className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline capitalize">
                {currentSound !== 'none' ? currentSound : 'Ambient'}
              </span>
            </button>

            {soundMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-stone-800 bg-[#171412] p-3 shadow-2xl z-50 text-stone-200">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800/80">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Ambient Audio
                  </span>
                  <span className="text-[11px] text-amber-400 font-mono">Synthesized Web Audio</span>
                </div>
                <div className="space-y-1 mb-3">
                  {soundOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = currentSound === opt.type;
                    return (
                      <button
                        key={opt.type}
                        onClick={() => handleSelectSound(opt.type)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                          isActive
                            ? 'bg-amber-500/20 text-amber-300 font-medium'
                            : 'text-stone-300 hover:bg-stone-800/70'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" />
                          <span>{opt.label}</span>
                        </span>
                        {isActive && <span className="text-[10px] text-amber-400">Playing</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Volume slider */}
                {currentSound !== 'none' && (
                  <div className="pt-2 border-t border-stone-800/80">
                    <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                      <span>Volume</span>
                      <span>{Math.round(volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Focus Button */}
          <button
            onClick={() => onSelectTab('focus')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-lg transition-all shadow-sm shadow-amber-500/20 whitespace-nowrap"
          >
            <span>Start Focus</span>
          </button>
        </div>
      </div>

      {/* Mobile sub-navigation bar */}
      <div className="md:hidden flex items-center justify-around border-t border-stone-800/60 bg-[#12100e] px-2 py-1.5">
        <button
          onClick={() => onSelectTab('home')}
          className={`px-2.5 py-1 text-xs font-medium rounded ${
            activeTab === 'home' ? 'text-amber-400 font-semibold' : 'text-stone-400'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => onSelectTab('focus')}
          className={`px-2.5 py-1 text-xs font-medium rounded ${
            activeTab === 'focus' ? 'text-amber-400 font-semibold' : 'text-stone-400'
          }`}
        >
          Focus
        </button>
        <button
          onClick={() => onSelectTab('notes')}
          className={`px-2.5 py-1 text-xs font-medium rounded ${
            activeTab === 'notes' ? 'text-amber-400 font-semibold' : 'text-stone-400'
          }`}
        >
          Notes
        </button>
        <button
          onClick={() => onSelectTab('generator')}
          className={`px-2.5 py-1 text-xs font-medium rounded ${
            activeTab === 'generator' ? 'text-amber-400 font-semibold' : 'text-stone-400'
          }`}
        >
          AI Quiz
        </button>
        <button
          onClick={() => onSelectTab('flashcards')}
          className={`px-2 py-1 text-xs font-medium rounded ${
            activeTab === 'flashcards' ? 'text-amber-400 font-semibold' : 'text-stone-400'
          }`}
        >
          Cards
        </button>
        <button
          onClick={() => onSelectTab('progress')}
          className={`px-2 py-1 text-xs font-medium rounded ${
            activeTab === 'progress' ? 'text-amber-400 font-semibold' : 'text-stone-400'
          }`}
        >
          Progress
        </button>
      </div>
    </header>
  );
};
