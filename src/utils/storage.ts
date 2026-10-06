import { Note, FlashcardItem, StudyStats, ActivityItem, SubjectActivityData } from '../types';

const NOTES_KEY = 'studyspace_notes_v1';
const STATS_KEY = 'studyspace_stats_v1';
const FLASHCARDS_KEY = 'studyspace_flashcards_v1';

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-cellular-respiration',
    title: 'Cellular Respiration & ATP Synthesis',
    subject: 'Biology',
    tags: ['Biochemistry', 'Metabolism', 'Mitochondria'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 2,
    isPinned: true,
    content: `# Cellular Respiration & ATP Synthesis

Cellular respiration is the biochemical pathway by which organisms combine oxygen with foodstuff molecules, diverting chemical energy into cellular activities and discarding waste products (carbon dioxide and water).

## 1. The Three Primary Stages

1. **Glycolysis (Cytoplasm)**:
   - Anaerobic process (does not require $O_2$).
   - 1 Molecule of Glucose ($C_6H_{12}O_6$) is broken down into **2 molecules of Pyruvate**.
   - Net yield: **2 ATP** and **2 NADH**.
   - Key regulatory enzyme: *Phosphofructokinase-1 (PFK-1)*, inhibited by high levels of ATP.

2. **The Krebs Cycle / Citric Acid Cycle (Mitochondrial Matrix)**:
   - Pyruvate undergoes oxidative decarboxylation to form Acetyl-CoA.
   - Acetyl-CoA ($2C$) combines with Oxaloacetate ($4C$) to form Citrate ($6C$).
   - Yield per glucose molecule (2 turns): **2 ATP (or GTP)**, **6 NADH**, **2 FADH_2**, and **4 CO_2**.

3. **Oxidative Phosphorylation & Electron Transport Chain (Inner Mitochondrial Membrane)**:
   - Electrons from NADH and FADH_2 are transferred through Complexes I-IV.
   - Protons ($H^+$) are pumped across the inner membrane into the intermembrane space, generating a steep **electrochemical proton gradient** (proton motive force).
   - Protons flow back through **ATP Synthase** (chemiosmosis), driving the phosphorylation of ADP to ATP.
   - Final electron acceptor: **Oxygen ($O_2$)**, which reduces to form water ($H_2O$).
   - Approximate yield: **26-28 ATP**.

## Key Summary Formula
$$C_6H_{12}O_6 + 6O_2 \\longrightarrow 6CO_2 + 6H_2O + \\sim 30\\text{-}32\\text{ ATP}$$

## Active Recall Questions to Practice
- What acts as the terminal electron acceptor in the electron transport chain?
- Why does FADH_2 yield fewer ATP than NADH? (Answer: enters at Complex II instead of Complex I).
- What happens if cyanide binds to Complex IV? (Electron transport halts, proton gradient collapses, ATP synthesis stops).`
  },
  {
    id: 'note-dsa-trees',
    title: 'Data Structures: Binary Search Trees & Balanced Trees',
    subject: 'Computer Science',
    tags: ['Algorithms', 'Trees', 'DataStructures'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    updatedAt: Date.now() - 1000 * 60 * 60 * 5,
    isPinned: true,
    content: `# Binary Search Trees (BST) & Self-Balancing Trees

## 1. BST Invariant
For every node $N$ in a Binary Search Tree:
- All keys in the left subtree must be strictly less than $N.key$.
- All keys in the right subtree must be strictly greater than $N.key$.
- In-order traversal of a valid BST always yields keys in sorted ascending order.

## 2. Time Complexity Comparison
| Operation | Average Case (Balanced) | Worst Case (Degenerate Linked List) | AVL / Red-Black Tree |
| :--- | :--- | :--- | :--- |
| **Search** | $O(\\log n)$ | $O(n)$ | $O(\\log n)$ |
| **Insertion** | $O(\\log n)$ | $O(n)$ | $O(\\log n)$ |
| **Deletion** | $O(\\log n)$ | $O(n)$ | $O(\\log n)$ |
| **Space** | $O(n)$ | $O(n)$ | $O(n)$ |

## 3. Tree Rotations
Self-balancing trees restore balance after insert/delete operations using constant-time rotations:
- **Right Rotation (LL case)**: Performed when a node's left child has a left-heavy subtree.
- **Left Rotation (RR case)**: Performed when a right child has a right-heavy subtree.
- **Left-Right Rotation (LR case)**: Left rotate the child, then right rotate the parent.
- **Right-Left Rotation (RL case)**: Right rotate the child, then left rotate the parent.

## Core Takeaways
- Degenerate BST occurs when data is inserted in pre-sorted order without balancing.
- AVL trees enforce strict balance factor $|h_L - h_R| \\le 1$.
- Red-Black trees trade slightly looser balance for faster insertions/deletions.`
  },
  {
    id: 'note-industrial-revolution',
    title: 'The Industrial Revolution: Technological & Social Shifts',
    subject: 'History',
    tags: ['ModernHistory', 'Economics', '19thCentury'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
    isPinned: false,
    content: `# The Industrial Revolution: Catalysts & Transformation

## 1. Why Britain First? (1760-1840)
Several unique converging geographical and institutional factors made Great Britain the cradle of industrialization:
- **Abundant Natural Resources**: Rich, accessible surface coal deposits and iron ore reserves in close proximity to ports and navigable waterways.
- **Agricultural Revolution**: Enclosure Acts and innovations like Jethro Tull's seed drill and four-field crop rotation created surplus food and displaced rural labor into urban centers.
- **Capital & Financial Institutions**: The Bank of England (1694), stable patent legal protections, and capital accumulated through global maritime trade.

## 2. Key Breakthrough Inventions
1. **The Steam Engine (James Watt, 1769)**: Rotary motion adaptation liberated factories from waterwheel riverbanks.
2. **The Spinning Jenny (James Hargreaves, 1764)**: Enabled multi-spindle yarn production.
3. **Puddling Process (Henry Cort, 1784)**: Produced wrought iron on an unprecedented industrial scale.

## 3. Societal & Economic Impacts
- **Rapid Urbanization**: Cities like Manchester exploded from market towns to massive industrial hubs with overcrowded tenements and sanitation crises.
- **Rise of Wage Labor**: Transition from artisanal household piece-work (cottage industry) to rigid factory shifts governed by clocks and mechanical division of labor.
- **Philosophical Backlash**: Gave rise to Luddite machine-breaking protests, early labor unions, and foundational texts in economic theory (Adam Smith's Wealth of Nations vs. Karl Marx's Das Kapital).`
  }
];

export const INITIAL_FLASHCARDS: FlashcardItem[] = [
  {
    id: 'fc-1',
    front: 'What is the net ATP yield from 1 molecule of glucose during Glycolysis alone?',
    back: 'Net 2 ATP (4 ATP produced minus 2 ATP consumed in the preparatory investment phase) and 2 NADH.',
    subject: 'Biology',
    difficulty: 'Medium',
    isBookmarked: true,
    sourceNoteId: 'note-cellular-respiration',
    masteryLevel: 'mastered',
    lastReviewed: Date.now() - 1000 * 60 * 60 * 12
  },
  {
    id: 'fc-2',
    front: 'What is the role of Oxygen (O2) in the Electron Transport Chain?',
    back: 'Oxygen serves as the terminal electron acceptor, binding free protons and low-energy electrons from Complex IV to form H2O.',
    subject: 'Biology',
    difficulty: 'Hard',
    isBookmarked: false,
    sourceNoteId: 'note-cellular-respiration',
    masteryLevel: 'learning',
    lastReviewed: Date.now() - 1000 * 60 * 60 * 20
  },
  {
    id: 'fc-3',
    front: 'Why does a degenerate Binary Search Tree degrade to O(n) search time?',
    back: 'When elements are inserted in sorted or reverse sorted order without rebalancing, the tree resembles a singly linked list with height equal to n.',
    subject: 'Computer Science',
    difficulty: 'Hard',
    isBookmarked: true,
    sourceNoteId: 'note-dsa-trees',
    masteryLevel: 'unseen'
  },
  {
    id: 'fc-4',
    front: 'What tree rotation is required for a Left-Right (LR) imbalance in an AVL tree?',
    back: 'First perform a Left Rotation on the left child, followed by a Right Rotation on the parent node.',
    subject: 'Computer Science',
    difficulty: 'Medium',
    isBookmarked: false,
    sourceNoteId: 'note-dsa-trees',
    masteryLevel: 'learning'
  },
  {
    id: 'fc-5',
    front: 'How did James Watt improve upon Thomas Newcomen\'s earlier atmospheric engine?',
    back: 'Watt added a separate condenser to prevent heating and cooling the main cylinder repeatedly, drastically improving fuel and thermal efficiency.',
    subject: 'History',
    difficulty: 'Easy',
    isBookmarked: false,
    sourceNoteId: 'note-industrial-revolution',
    masteryLevel: 'mastered'
  }
];

export function getStoredNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) {
      localStorage.setItem(NOTES_KEY, JSON.stringify(INITIAL_NOTES));
      return INITIAL_NOTES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading notes from storage', err);
    return INITIAL_NOTES;
  }
}

export function saveStoredNotes(notes: Note[]): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (err) {
    console.error('Error saving notes to storage', err);
  }
}

export function getStoredFlashcards(): FlashcardItem[] {
  try {
    const raw = localStorage.getItem(FLASHCARDS_KEY);
    if (!raw) {
      localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(INITIAL_FLASHCARDS));
      return INITIAL_FLASHCARDS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading flashcards from storage', err);
    return INITIAL_FLASHCARDS;
  }
}

export function saveStoredFlashcards(cards: FlashcardItem[]): void {
  try {
    localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(cards));
  } catch (err) {
    console.error('Error saving flashcards to storage', err);
  }
}

export const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'flashcards',
    title: 'Completed 25 flashcards',
    description: 'Mastered Cellular Respiration & ATP synthesis deck',
    subject: 'Biology',
    timestamp: Date.now() - 1000 * 60 * 25, // 25 mins ago
  },
  {
    id: 'act-2',
    type: 'focus',
    title: 'Finished a 50-minute Deep Focus session',
    description: '40Hz Gamma Focus Audio · Zero distractions',
    subject: 'History',
    timestamp: Date.now() - 1000 * 60 * 110, // ~2 hours ago
  },
  {
    id: 'act-3',
    type: 'quiz',
    title: 'Generated 10 Economics questions',
    description: 'Active recall practice scored 90%',
    subject: 'Economics',
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
  },
  {
    id: 'act-4',
    type: 'note',
    title: 'Created a History note',
    description: 'Industrial Revolution: Catalysts & Transformation',
    subject: 'History',
    timestamp: Date.now() - 1000 * 60 * 60 * 22, // yesterday
  },
];

export const INITIAL_SUBJECT_ACTIVITY: Record<string, SubjectActivityData> = {
  History: { questionsSolved: 32, cardsReviewed: 24, focusMinutes: 80 },
  'Political Science': { questionsSolved: 28, cardsReviewed: 18, focusMinutes: 60 },
  Economics: { questionsSolved: 24, cardsReviewed: 16, focusMinutes: 50 },
  English: { questionsSolved: 22, cardsReviewed: 14, focusMinutes: 45 },
  Psychology: { questionsSolved: 18, cardsReviewed: 14, focusMinutes: 40 },
  Biology: { questionsSolved: 35, cardsReviewed: 30, focusMinutes: 90 },
  'Computer Science': { questionsSolved: 26, cardsReviewed: 20, focusMinutes: 65 },
};

export function getStoredStats(): StudyStats {
  const today = new Date().toISOString().split('T')[0];
  const defaultStats: StudyStats = {
    totalMinutes: 275, // 4h 35m
    totalSessions: 6,
    streakDays: 7,
    lastStudyDate: today,
    dailyGoalMinutes: 60,
    cardsReviewedCount: 86,
    questionsSolvedCount: 124,
    notesCreatedCount: 5,
    subjectActivity: INITIAL_SUBJECT_ACTIVITY,
    activities: INITIAL_ACTIVITIES,
    weeklyFocusHistory: {
      mon: 45,
      tue: 60,
      wed: 30,
      thu: 75,
      fri: 50,
      sat: 90,
      sun: 40,
    },
    history: [
      { date: today, minutes: 45, sessions: 2 },
      { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], minutes: 60, sessions: 2 },
      { date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], minutes: 50, sessions: 1 },
    ],
  };

  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      localStorage.setItem(STATS_KEY, JSON.stringify(defaultStats));
      return defaultStats;
    }
    const parsed = JSON.parse(raw);

    // Merge defaults so older stores gracefully gain all new properties
    return {
      totalMinutes: parsed.totalMinutes ?? defaultStats.totalMinutes,
      totalSessions: parsed.totalSessions ?? defaultStats.totalSessions,
      streakDays: parsed.streakDays ?? defaultStats.streakDays,
      lastStudyDate: parsed.lastStudyDate ?? defaultStats.lastStudyDate,
      dailyGoalMinutes: parsed.dailyGoalMinutes ?? defaultStats.dailyGoalMinutes,
      cardsReviewedCount: parsed.cardsReviewedCount ?? defaultStats.cardsReviewedCount,
      questionsSolvedCount: parsed.questionsSolvedCount ?? defaultStats.questionsSolvedCount,
      notesCreatedCount: parsed.notesCreatedCount ?? defaultStats.notesCreatedCount,
      subjectActivity: { ...defaultStats.subjectActivity, ...(parsed.subjectActivity || {}) },
      activities: parsed.activities?.length ? parsed.activities : defaultStats.activities,
      weeklyFocusHistory: { ...defaultStats.weeklyFocusHistory, ...(parsed.weeklyFocusHistory || {}) },
      history: parsed.history || defaultStats.history,
    };
  } catch (err) {
    return defaultStats;
  }
}

function saveStats(stats: StudyStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Error saving stats to storage', err);
  }
}

export function recordCompletedSession(minutes: number, subject?: string): StudyStats {
  const current = getStoredStats();
  const today = new Date().toISOString().split('T')[0];

  const updatedMinutes = current.totalMinutes + minutes;
  const updatedSessions = current.totalSessions + 1;

  let streak = current.streakDays;
  if (current.lastStudyDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (current.lastStudyDate === yesterday) {
      streak += 1;
    } else if (!current.lastStudyDate) {
      streak = 1;
    } else {
      streak = 1;
    }
  }

  // Update history array
  const existingHistoryDay = current.history.find((h) => h.date === today);
  let updatedHistory = [...current.history];
  if (existingHistoryDay) {
    updatedHistory = updatedHistory.map((h) =>
      h.date === today ? { ...h, minutes: h.minutes + minutes, sessions: h.sessions + 1 } : h
    );
  } else {
    updatedHistory.push({ date: today, minutes, sessions: 1 });
  }

  // Update day of week in weeklyFocusHistory
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  const dayOfWeek = dayNames[new Date().getDay()];
  const updatedWeekly = {
    ...current.weeklyFocusHistory,
    [dayOfWeek]: ((current.weeklyFocusHistory as any)?.[dayOfWeek] || 0) + minutes,
  };

  // Update subject activity
  const targetSub = subject || 'General Studies';
  const currentSubData = current.subjectActivity[targetSub] || { questionsSolved: 0, cardsReviewed: 0, focusMinutes: 0 };
  const updatedSubjectActivity = {
    ...current.subjectActivity,
    [targetSub]: {
      ...currentSubData,
      focusMinutes: currentSubData.focusMinutes + minutes,
    },
  };

  // Prepend activity log
  const newActivity: ActivityItem = {
    id: `act-${Date.now()}`,
    type: 'focus',
    title: `Finished a ${minutes}-minute Deep Focus session`,
    description: `${targetSub} · Recorded session complete`,
    subject: targetSub,
    timestamp: Date.now(),
  };

  const updatedStats: StudyStats = {
    ...current,
    totalMinutes: updatedMinutes,
    totalSessions: updatedSessions,
    streakDays: streak,
    lastStudyDate: today,
    history: updatedHistory,
    weeklyFocusHistory: updatedWeekly as any,
    subjectActivity: updatedSubjectActivity,
    activities: [newActivity, ...current.activities].slice(0, 30),
  };

  saveStats(updatedStats);
  return updatedStats;
}

export function recordFlashcardsReviewed(count: number, subject?: string): StudyStats {
  const current = getStoredStats();
  const targetSub = subject || 'General';
  const currentSubData = current.subjectActivity[targetSub] || { questionsSolved: 0, cardsReviewed: 0, focusMinutes: 0 };

  const updatedSubjectActivity = {
    ...current.subjectActivity,
    [targetSub]: {
      ...currentSubData,
      cardsReviewed: currentSubData.cardsReviewed + count,
    },
  };

  const newActivity: ActivityItem = {
    id: `act-${Date.now()}`,
    type: 'flashcards',
    title: `Completed ${count} flashcard${count > 1 ? 's' : ''}`,
    description: `Reviewed and rated active recall cards in ${targetSub}`,
    subject: targetSub,
    timestamp: Date.now(),
  };

  const updatedStats: StudyStats = {
    ...current,
    cardsReviewedCount: current.cardsReviewedCount + count,
    subjectActivity: updatedSubjectActivity,
    activities: [newActivity, ...current.activities].slice(0, 30),
  };

  saveStats(updatedStats);
  return updatedStats;
}

export function recordQuestionsSolved(count: number, subject?: string): StudyStats {
  const current = getStoredStats();
  const targetSub = subject || 'General Studies';
  const currentSubData = current.subjectActivity[targetSub] || { questionsSolved: 0, cardsReviewed: 0, focusMinutes: 0 };

  const updatedSubjectActivity = {
    ...current.subjectActivity,
    [targetSub]: {
      ...currentSubData,
      questionsSolved: currentSubData.questionsSolved + count,
    },
  };

  const newActivity: ActivityItem = {
    id: `act-${Date.now()}`,
    type: 'quiz',
    title: `Solved ${count} ${targetSub} questions`,
    description: `Completed AI active recall quiz assessment`,
    subject: targetSub,
    timestamp: Date.now(),
  };

  const updatedStats: StudyStats = {
    ...current,
    questionsSolvedCount: current.questionsSolvedCount + count,
    subjectActivity: updatedSubjectActivity,
    activities: [newActivity, ...current.activities].slice(0, 30),
  };

  saveStats(updatedStats);
  return updatedStats;
}

export function recordNoteCreated(title: string, subject?: string): StudyStats {
  const current = getStoredStats();
  const targetSub = subject || 'General Studies';

  const newActivity: ActivityItem = {
    id: `act-${Date.now()}`,
    type: 'note',
    title: `Created a ${targetSub} note`,
    description: title,
    subject: targetSub,
    timestamp: Date.now(),
  };

  const updatedStats: StudyStats = {
    ...current,
    notesCreatedCount: current.notesCreatedCount + 1,
    activities: [newActivity, ...current.activities].slice(0, 30),
  };

  saveStats(updatedStats);
  return updatedStats;
}

export function updateDailyGoal(minutes: number): StudyStats {
  const current = getStoredStats();
  const updatedStats: StudyStats = {
    ...current,
    dailyGoalMinutes: minutes,
  };
  saveStats(updatedStats);
  return updatedStats;
}
