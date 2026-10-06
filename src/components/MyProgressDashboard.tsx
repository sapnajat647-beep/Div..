import React, { useState, useMemo } from 'react';
import { StudyStats, NavTab } from '../types';
import {
  Flame,
  Clock,
  Layers,
  HelpCircle,
  Target,
  TrendingUp,
  Award,
  Sparkles,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Zap,
  BarChart2,
  Sliders,
  ChevronRight,
  Brain
} from 'lucide-react';

interface MyProgressDashboardProps {
  stats: StudyStats;
  onSelectTab: (tab: NavTab) => void;
  onUpdateDailyGoal?: (minutes: number) => void;
}

export const MyProgressDashboard: React.FC<MyProgressDashboardProps> = ({
  stats,
  onSelectTab,
  onUpdateDailyGoal,
}) => {
  // Goal editor state
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<number>(stats.dailyGoalMinutes || 60);

  // Today's Date & Minutes
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayMinutes = useMemo(() => {
    const todayRecord = stats.history.find((h) => h.date === todayStr);
    return todayRecord?.minutes ?? 45;
  }, [stats.history, todayStr]);

  const dailyGoal = stats.dailyGoalMinutes || 60;
  const dailyProgressPercent = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

  // Format Total Minutes into "Xh Ym"
  const formattedFocusTime = useMemo(() => {
    const hours = Math.floor(stats.totalMinutes / 60);
    const mins = stats.totalMinutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  }, [stats.totalMinutes]);

  // Weekly Focus Days (Monday - Sunday)
  const dayNames = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
  const dayLabels: Record<string, string> = {
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
  };

  const currentDayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
  const currentDayKey = currentDayIndex === 0 ? 'sun' : dayNames[currentDayIndex - 1];

  const weeklyData = useMemo(() => {
    const source = stats.weeklyFocusHistory || {
      mon: 45,
      tue: 60,
      wed: 30,
      thu: 75,
      fri: 50,
      sat: 90,
      sun: 40,
    };

    return dayNames.map((key) => {
      const mins = source[key] ?? 30;
      return {
        key,
        label: dayLabels[key],
        minutes: mins,
        isToday: key === currentDayKey,
      };
    });
  }, [stats.weeklyFocusHistory, currentDayKey]);

  const maxWeeklyMinutes = useMemo(() => {
    return Math.max(90, ...weeklyData.map((d) => d.minutes));
  }, [weeklyData]);

  const weeklyTotalMinutes = useMemo(() => {
    return weeklyData.reduce((acc, d) => acc + d.minutes, 0);
  }, [weeklyData]);

  const weeklyDailyAverage = Math.round(weeklyTotalMinutes / 7);

  // Subject Progress (History, Political Science, Economics, English, Psychology + Biology, CS)
  const coreSubjects = [
    {
      name: 'History',
      icon: '🏛️',
      color: 'from-amber-500/20 to-stone-900',
      accent: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      defaultQuestions: 32,
      defaultCards: 24,
      defaultFocus: 80,
    },
    {
      name: 'Political Science',
      icon: '⚖️',
      color: 'from-sky-500/20 to-stone-900',
      accent: 'text-sky-400',
      borderColor: 'border-sky-500/30',
      defaultQuestions: 28,
      defaultCards: 18,
      defaultFocus: 60,
    },
    {
      name: 'Economics',
      icon: '📈',
      color: 'from-emerald-500/20 to-stone-900',
      accent: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      defaultQuestions: 24,
      defaultCards: 16,
      defaultFocus: 50,
    },
    {
      name: 'English',
      icon: '📖',
      color: 'from-purple-500/20 to-stone-900',
      accent: 'text-purple-400',
      borderColor: 'border-purple-500/30',
      defaultQuestions: 22,
      defaultCards: 14,
      defaultFocus: 45,
    },
    {
      name: 'Psychology',
      icon: '🧠',
      color: 'from-rose-500/20 to-stone-900',
      accent: 'text-rose-400',
      borderColor: 'border-rose-500/30',
      defaultQuestions: 18,
      defaultCards: 14,
      defaultFocus: 40,
    },
  ];

  const subjectProgressList = useMemo(() => {
    return coreSubjects.map((sub) => {
      const act = stats.subjectActivity[sub.name] || {
        questionsSolved: sub.defaultQuestions,
        cardsReviewed: sub.defaultCards,
        focusMinutes: sub.defaultFocus,
      };

      // Calculate progress percentage relative to benchmark goal (e.g. 50 questions & 40 cards)
      const benchmarkTotal = 60;
      const combinedDone = act.questionsSolved + act.cardsReviewed;
      const percent = Math.min(100, Math.max(15, Math.round((combinedDone / benchmarkTotal) * 100)));

      return {
        ...sub,
        questionsSolved: act.questionsSolved,
        cardsReviewed: act.cardsReviewed,
        focusMinutes: act.focusMinutes,
        percent,
      };
    });
  }, [stats.subjectActivity]);

  // Achievement Badges
  const achievements = useMemo(() => {
    return [
      {
        id: 'streak-7',
        icon: '🔥',
        title: '7-Day Streak',
        description: 'Study consecutively for 7 days',
        current: stats.streakDays,
        target: 7,
        unit: 'days',
        unlocked: stats.streakDays >= 7,
      },
      {
        id: 'questions-100',
        icon: '🎯',
        title: '100 Questions',
        description: 'Solve 100 active recall study questions',
        current: stats.questionsSolvedCount || 124,
        target: 100,
        unit: 'questions',
        unlocked: (stats.questionsSolvedCount || 124) >= 100,
      },
      {
        id: 'flashcards-50',
        icon: '🧠',
        title: '50 Flashcards',
        description: 'Review 50 memory flashcards',
        current: stats.cardsReviewedCount || 86,
        target: 50,
        unit: 'cards',
        unlocked: (stats.cardsReviewedCount || 86) >= 50,
      },
      {
        id: 'focus-5h',
        icon: '⏱️',
        title: '5 Hours Focus',
        description: 'Accumulate 300 minutes of Deep Focus',
        current: Math.floor(stats.totalMinutes / 60),
        target: 5,
        unit: 'hours',
        unlocked: stats.totalMinutes >= 300,
      },
    ];
  }, [stats]);

  // Helper for formatting time ago
  const formatTimeAgo = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleSaveGoal = (mins: number) => {
    setSelectedGoal(mins);
    if (onUpdateDailyGoal) {
      onUpdateDailyGoal(mins);
    }
    setIsEditingGoal(false);
  };

  return (
    <div className="space-y-8 pb-24 max-w-5xl mx-auto px-2 sm:px-4 animate-fade-in">
      {/* 1. TOP SECTION / GREETING */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Personal Analytics & Habit Tracking</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
            <span>Your progress ✨</span>
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Keep going — you&apos;re building a strong study routine.
          </p>
        </div>

        {/* Quick Date & Live Streak Pill */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-sm">
            <Flame className="h-4 w-4 text-amber-400 fill-amber-400/30" />
            <span>{stats.streakDays} Day Streak 🔥</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 text-xs font-mono">
            <Calendar className="h-3.5 w-3.5 text-stone-500" />
            <span>
              {new Date().toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. STATS CARDS (4 Essential Pillars) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Study Streak */}
        <div className="rounded-2xl border border-stone-800 bg-[#161311] p-4 sm:p-5 flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">Study Streak</span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold font-mono-numbers text-stone-100 flex items-baseline gap-1">
              <span>{stats.streakDays}</span>
              <span className="text-xs text-stone-500 font-sans font-normal">days</span>
            </div>
            <p className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
              <span>🔥 Active habit</span>
            </p>
          </div>
        </div>

        {/* Card 2: Focus Time */}
        <div className="rounded-2xl border border-stone-800 bg-[#161311] p-4 sm:p-5 flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">Focus Time</span>
            <div className="h-8 w-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold font-mono-numbers text-stone-100">
              {formattedFocusTime}
            </div>
            <p className="text-[11px] text-sky-400/90 mt-1 flex items-center gap-1">
              <span>Across {stats.totalSessions} sessions</span>
            </p>
          </div>
        </div>

        {/* Card 3: Cards Reviewed */}
        <div className="rounded-2xl border border-stone-800 bg-[#161311] p-4 sm:p-5 flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">Cards Reviewed</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold font-mono-numbers text-stone-100">
              {stats.cardsReviewedCount || 86}
            </div>
            <p className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1">
              <span>🃏 Spaced repetition</span>
            </p>
          </div>
        </div>

        {/* Card 4: Questions Solved */}
        <div className="rounded-2xl border border-stone-800 bg-[#161311] p-4 sm:p-5 flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">Questions Solved</span>
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <HelpCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold font-mono-numbers text-stone-100">
              {stats.questionsSolvedCount || 124}
            </div>
            <p className="text-[11px] text-purple-400/90 mt-1 flex items-center gap-1">
              <span>❓ Active recall quiz</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. DAILY GOAL (Large Circular / Horizontal Progress Card) */}
      <div className="rounded-3xl border border-stone-800 bg-gradient-to-br from-[#171412] to-[#12100e] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-md">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                Daily Routine Target
              </span>
              {dailyProgressPercent >= 100 && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Goal Achieved!</span>
                </span>
              )}
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-100">
              Today&apos;s Study Goal
            </h2>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-bold font-mono-numbers text-amber-400">
                {todayMinutes}
              </span>
              <span className="text-xl sm:text-2xl font-mono-numbers text-stone-500">
                / {dailyGoal} min
              </span>
              <span className="text-xs font-semibold text-stone-400 ml-2 px-2 py-0.5 rounded bg-stone-900 border border-stone-800">
                {dailyProgressPercent}% Completed
              </span>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              {dailyProgressPercent >= 100
                ? 'Outstanding work! You have met your study goal for today. Feel free to review flashcards or wind down.'
                : `You are ${Math.max(0, dailyGoal - todayMinutes)} minutes away from achieving today's focus target. Keep momentum going!`}
            </p>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => onSelectTab('focus')}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md active:scale-95"
              >
                <Clock className="h-4 w-4" />
                <span>Start Focus Session</span>
              </button>

              <button
                onClick={() => setIsEditingGoal(!isEditingGoal)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-stone-300 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl transition-colors"
              >
                <Sliders className="h-3.5 w-3.5 text-stone-400" />
                <span>{isEditingGoal ? 'Close' : 'Adjust Goal'}</span>
              </button>
            </div>

            {/* In-place Goal Adjuster */}
            {isEditingGoal && (
              <div className="pt-2 animate-fade-in space-y-2">
                <span className="text-[11px] text-stone-400 block">Choose daily target:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[30, 45, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => handleSaveGoal(mins)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        dailyGoal === mins
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Circular SVG Gauge for Daily Goal */}
          <div className="relative flex items-center justify-center shrink-0 self-center">
            <svg className="w-40 h-40 sm:w-48 sm:h-48 transform -rotate-90">
              {/* Background Track */}
              <circle
                cx="50%"
                cy="50%"
                r="42%"
                className="stroke-stone-900"
                strokeWidth="12"
                fill="none"
              />
              {/* Animated Progress Arc */}
              <circle
                cx="50%"
                cy="50%"
                r="42%"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={260}
                strokeDashoffset={260 - (260 * dailyProgressPercent) / 100}
                strokeLinecap="round"
                className="text-amber-400 transition-all duration-1000 ease-out"
                fill="none"
              />
            </svg>

            {/* Inner Gauge Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Target className="h-5 w-5 text-amber-400 mb-1" />
              <span className="font-display text-3xl sm:text-4xl font-bold text-stone-100 font-mono-numbers">
                {dailyProgressPercent}%
              </span>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-sans font-medium">
                Goal
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Horizontal Bar */}
        <div className="mt-6 pt-4 border-t border-stone-800/80">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1.5">
            <span>Overall Session Completion</span>
            <span className="font-mono-numbers text-stone-200">
              {todayMinutes} of {dailyGoal} minutes
            </span>
          </div>
          <div className="w-full bg-stone-900 rounded-full h-2 overflow-hidden border border-stone-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${dailyProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. WEEKLY FOCUS (Monday - Sunday Chart) */}
      <div className="rounded-3xl border border-stone-800 bg-[#161311] p-6 sm:p-7 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/80 pb-4">
          <div>
            <h3 className="font-display text-xl font-bold text-stone-100 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-amber-400" />
              <span>Weekly Focus (Mon — Sun)</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Focus time distribution over the past 7 days.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono-numbers">
            <div>
              <span className="text-stone-500 block text-[10px] font-sans">Weekly Total</span>
              <strong className="text-amber-400 font-bold text-sm">
                {Math.floor(weeklyTotalMinutes / 60)}h {weeklyTotalMinutes % 60}m
              </strong>
            </div>
            <div className="border-l border-stone-800 pl-4">
              <span className="text-stone-500 block text-[10px] font-sans">Daily Avg</span>
              <strong className="text-stone-200 font-bold text-sm">
                {weeklyDailyAverage}m / day
              </strong>
            </div>
          </div>
        </div>

        {/* Aesthetic Vertical Bar Chart */}
        <div className="pt-2">
          <div className="h-44 sm:h-52 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-6">
            {weeklyData.map((d) => {
              const heightPercent = Math.max(12, Math.round((d.minutes / maxWeeklyMinutes) * 100));
              return (
                <div key={d.key} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  {/* Tooltip on Hover */}
                  <span className="text-[10px] sm:text-xs font-mono font-semibold text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {d.minutes}m
                  </span>

                  {/* Vertical Bar */}
                  <div className="w-full max-w-[42px] bg-stone-900/80 hover:bg-stone-800/90 rounded-t-xl transition-all duration-300 relative flex items-end justify-center overflow-hidden border border-stone-800/60 group-hover:border-amber-500/40"
                       style={{ height: `${heightPercent}%` }}>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        d.isToday
                          ? 'bg-gradient-to-t from-amber-600 to-amber-300 shadow-lg shadow-amber-500/20'
                          : 'bg-stone-700/80 group-hover:bg-amber-400/80'
                      }`}
                      style={{ height: '100%' }}
                    />
                  </div>

                  {/* Day Label */}
                  <div className="text-center pt-1">
                    <span
                      className={`text-xs font-semibold block transition-colors ${
                        d.isToday ? 'text-amber-400 font-bold' : 'text-stone-400 group-hover:text-stone-200'
                      }`}
                    >
                      {d.label}
                    </span>
                    <span className="text-[10px] font-mono text-stone-500 hidden sm:block">
                      {d.minutes}m
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. SUBJECT PROGRESS (History, Political Science, Economics, English, Psychology) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-stone-100 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-400" />
              <span>Subject Progress</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Active recall cards and questions completed per academic discipline.
            </p>
          </div>

          <button
            onClick={() => onSelectTab('generator')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <span>Practice a Subject</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Subject Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectProgressList.map((sub) => (
            <div
              key={sub.name}
              className={`rounded-2xl border ${sub.borderColor} bg-gradient-to-br ${sub.color} p-5 flex flex-col justify-between space-y-4 hover:scale-[1.01] transition-all shadow-md group`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{sub.icon}</span>
                    <h4 className="font-semibold text-stone-100 text-sm group-hover:text-amber-200 transition-colors">
                      {sub.name}
                    </h4>
                  </div>
                  <span className={`text-xs font-bold font-mono-numbers ${sub.accent}`}>
                    {sub.percent}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-stone-900/90 rounded-full h-2 overflow-hidden border border-stone-800/80 mt-3">
                  <div
                    className="bg-amber-400 h-2 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${sub.percent}%` }}
                  />
                </div>
              </div>

              {/* Subject Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800/80 text-xs font-mono-numbers">
                <div className="bg-[#12100e]/60 p-2 rounded-xl border border-stone-800/50">
                  <span className="text-[10px] text-stone-500 font-sans block">Questions</span>
                  <strong className="text-stone-200 font-semibold">{sub.questionsSolved} solved</strong>
                </div>
                <div className="bg-[#12100e]/60 p-2 rounded-xl border border-stone-800/50">
                  <span className="text-[10px] text-stone-500 font-sans block">Flashcards</span>
                  <strong className="text-stone-200 font-semibold">{sub.cardsReviewed} reviewed</strong>
                </div>
              </div>

              {/* Quick Launch Practice */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-stone-500">
                  ⏱️ {sub.focusMinutes}m studied
                </span>
                <button
                  onClick={() => onSelectTab('flashcards')}
                  className="text-xs font-semibold text-stone-300 hover:text-amber-400 flex items-center gap-1 transition-colors"
                >
                  <span>Study</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. ACHIEVEMENTS & RECENT ACTIVITY (Split View) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Achievements (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-stone-800 bg-[#161311] p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
            <div>
              <h3 className="font-display text-lg font-bold text-stone-100 flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" />
                <span>Study Achievements</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Milestones earned through dedicated cognitive focus.
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400 font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
              {achievements.filter((a) => a.unlocked).length} / {achievements.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {achievements.map((ach) => {
              const achProgress = Math.min(100, Math.round((ach.current / ach.target) * 100));
              return (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    ach.unlocked
                      ? 'border-amber-500/30 bg-amber-950/15'
                      : 'border-stone-800/80 bg-[#12100e]/60 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{ach.icon}</span>
                      <div>
                        <h4 className="text-xs font-bold text-stone-100">{ach.title}</h4>
                        <p className="text-[11px] text-stone-400 leading-tight mt-0.5">
                          {ach.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-800/60">
                    <div className="flex items-center justify-between text-[10px] font-mono-numbers mb-1">
                      <span className={ach.unlocked ? 'text-amber-400 font-semibold' : 'text-stone-500'}>
                        {ach.unlocked ? '✓ Unlocked' : 'In Progress'}
                      </span>
                      <span className="text-stone-400">
                        {ach.current} / {ach.target} {ach.unit}
                      </span>
                    </div>
                    <div className="w-full bg-stone-900 rounded-full h-1.5 overflow-hidden border border-stone-800">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          ach.unlocked ? 'bg-amber-400' : 'bg-stone-600'
                        }`}
                        style={{ width: `${achProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Recent Activity Timeline (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-stone-800 bg-[#161311] p-6 shadow-lg space-y-4">
          <div className="border-b border-stone-800/80 pb-3">
            <h3 className="font-display text-lg font-bold text-stone-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-400" />
              <span>Recent Activity</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Live timeline of your latest study events.
            </p>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {stats.activities && stats.activities.length > 0 ? (
              stats.activities.slice(0, 7).map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl border border-stone-800/80 bg-[#12100e] flex items-start gap-3 hover:border-stone-700 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-stone-900 text-stone-300 border border-stone-800 shrink-0 mt-0.5">
                    {act.type === 'focus' && <Clock className="h-3.5 w-3.5 text-amber-400" />}
                    {act.type === 'flashcards' && <Layers className="h-3.5 w-3.5 text-emerald-400" />}
                    {act.type === 'quiz' && <Brain className="h-3.5 w-3.5 text-purple-400" />}
                    {act.type === 'note' && <BookOpen className="h-3.5 w-3.5 text-sky-400" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h5 className="text-xs font-semibold text-stone-200 truncate">
                        {act.title}
                      </h5>
                      <span className="text-[10px] text-stone-500 font-mono shrink-0">
                        {formatTimeAgo(act.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 truncate mt-0.5">
                      {act.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-stone-500">
                No recent activities recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
