/**
 * Knowledge categories and score computation (mirrored in edge function).
 */

export const LESSON_TITLES: Record<number, string> = {
  1: "What Is Money?",
  2: "Why Do We Work?",
  3: "Income vs Expenses",
  4: "Assets vs Liabilities",
  5: "Why Saving Money Matters",
  6: "How To Create A Budget",
  7: "Emergency Funds Explained",
  8: "Good Debt vs Bad Debt",
  9: "Banking Basics",
  10: "What Is Inflation?",
  11: "What Is The Financial Market?",
  12: "What Is A Stock Exchange?",
  13: "What Is A Stock?",
  14: "What Is A Bond?",
  15: "What Is An ETF?",
  16: "Compound Interest & Time in the Market",
  17: "What Is Diversification?",
  18: "Introduction To Retirement Planning",
  19: "Digital Assets & Cryptocurrency",
  20: "Your Journey To Financial Freedom",
};

export const CATEGORIES = [
  { id: "money_basics", label: "Money Basics", lessons: [1, 2, 3, 4, 5] },
  { id: "budgeting", label: "Budgeting", lessons: [6, 7, 8, 9, 10] },
  { id: "investing", label: "Investing", lessons: [11, 12, 13, 14, 15] },
  { id: "taxes", label: "Taxes", lessons: [] as number[] },
  { id: "retirement", label: "Retirement", lessons: [16, 17, 18] },
  { id: "crypto", label: "Crypto", lessons: [19, 20] },
];

export type ProgressRow = {
  lesson_number: number;
  quiz_score: number | null;
  quiz_total: number | null;
  completed_at?: string;
};

export type CategoryScore = {
  id: string;
  label: string;
  score: number | null;
  completedLessons: number;
  totalLessons: number;
};

export type WeakArea = {
  lessonNumber: number;
  title: string;
  pct: number;
};

function progressMap(rows: ProgressRow[]): Map<number, ProgressRow> {
  const map = new Map<number, ProgressRow>();
  for (const row of rows) map.set(row.lesson_number, row);
  return map;
}

export function computeCategoryScores(rows: ProgressRow[]): CategoryScore[] {
  const done = progressMap(rows);
  return CATEGORIES.map((cat) => {
    if (cat.lessons.length === 0) {
      return { id: cat.id, label: cat.label, score: null, completedLessons: 0, totalLessons: 0 };
    }
    let sum = 0;
    let count = 0;
    let completed = 0;
    for (const n of cat.lessons) {
      const row = done.get(n);
      if (!row) continue;
      completed++;
      const total = row.quiz_total || 1;
      const score = row.quiz_score ?? 0;
      sum += Math.round((score / total) * 100);
      count++;
    }
    return {
      id: cat.id,
      label: cat.label,
      score: count > 0 ? Math.round(sum / count) : 0,
      completedLessons: completed,
      totalLessons: cat.lessons.length,
    };
  });
}

export function computeWeakAreas(rows: ProgressRow[], limit = 3): WeakArea[] {
  const weak: WeakArea[] = [];
  for (const row of rows) {
    const total = row.quiz_total || 1;
    const score = row.quiz_score ?? 0;
    const pct = Math.round((score / total) * 100);
    if (pct < 70) {
      weak.push({
        lessonNumber: row.lesson_number,
        title: LESSON_TITLES[row.lesson_number] || `Lesson ${row.lesson_number}`,
        pct,
      });
    }
  }
  weak.sort((a, b) => a.pct - b.pct);
  return weak.slice(0, limit);
}

export function lastCompletedLesson(rows: ProgressRow[]): ProgressRow | null {
  if (!rows.length) return null;
  const sorted = [...rows].sort(
    (a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime(),
  );
  return sorted[0];
}

export function formatKnowledgeSummary(rows: ProgressRow[]): string {
  const scores = computeCategoryScores(rows);
  const parts = scores
    .filter((s) => s.totalLessons > 0 && s.completedLessons > 0)
    .map((s) => `${s.label} ${s.score}%`);
  return parts.length ? parts.join(", ") : "No lessons completed yet";
}

export function formatWeakAreasSummary(rows: ProgressRow[]): string {
  const weak = computeWeakAreas(rows);
  if (!weak.length) return "None identified yet";
  return weak.map((w) => `${w.title} (${w.pct}%)`).join("; ");
}
