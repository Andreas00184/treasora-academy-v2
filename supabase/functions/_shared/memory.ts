import {
  computeCategoryScores,
  computeWeakAreas,
  formatKnowledgeSummary,
  formatWeakAreasSummary,
  lastCompletedLesson,
  LESSON_TITLES,
  type ProgressRow,
} from "./knowledge.ts";

export type UserMemory = {
  profile: { full_name: string | null; is_pro: boolean; ui_language: string | null } | null;
  passport: {
    knowledge_level: string;
    preferred_language: string;
    learning_pace: string;
    biggest_goal: string;
    country: string | null;
    portfolio_interests: string | null;
    favorite_investments: string | null;
    last_topic_discussed: string | null;
  } | null;
  progress: ProgressRow[];
  recentMessages: { role: string; content: string }[];
};

export async function fetchUserMemory(
  admin: ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2.49.1").createClient>,
  userId: string,
): Promise<UserMemory> {
  const [profileRes, passportRes, progressRes, messagesRes] = await Promise.all([
    admin.from("profiles").select("full_name, is_pro, ui_language").eq("id", userId).maybeSingle(),
    admin.from("financial_passports").select("*").eq("user_id", userId).maybeSingle(),
    admin.from("lesson_progress").select("lesson_number, quiz_score, quiz_total, completed_at").eq("user_id", userId),
    admin
      .from("dominar_messages")
      .select("role, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const recentMessages = (messagesRes.data || [])
    .slice()
    .reverse()
    .map((m) => ({ role: m.role, content: m.content }));

  return {
    profile: profileRes.data,
    passport: passportRes.data,
    progress: progressRes.data || [],
    recentMessages,
  };
}

export function firstName(fullName: string | null | undefined): string {
  if (!fullName) return "there";
  return fullName.trim().split(/\s+/)[0] || "there";
}

export function buildSystemPrompt(memory: UserMemory): string {
  const { profile, passport, progress } = memory;
  const name = firstName(profile?.full_name);
  const uiLang = profile?.ui_language || passport?.preferred_language || "en";
  const langCode = uiLang === "Italian" ? "it" : uiLang === "Spanish" ? "es" : uiLang.length === 2 ? uiLang : "en";
  const langNames: Record<string, string> = { en: "English", it: "Italian", es: "Spanish" };
  const respondIn = langNames[langCode] || "English";

  const lines: string[] = [
    "You are Dominar, Treasora Academy's AI financial education assistant and personal mentor.",
    "Give clear, practical answers about personal finance, investing, and the Treasora curriculum.",
    "Never provide personalized investment advice or guarantee returns. Encourage learning and responsible decisions.",
    `IMPORTANT: Always respond in ${respondIn}. The user's selected interface language is ${langCode}. Continue in ${respondIn} even when referencing prior messages, unless the user explicitly asks to switch language.`,
    "Use the learner context below to personalize every response — reference their goals, progress, and weak areas when relevant.",
    "",
    "=== LEARNER CONTEXT ===",
    `Name: ${name}`,
    `Interface language: ${respondIn} (${langCode})`,
  ];

  if (passport) {
    lines.push(`Knowledge level: ${passport.knowledge_level}`);
    lines.push(`Preferred language: ${passport.preferred_language}`);
    lines.push(`Learning pace: ${passport.learning_pace}`);
    if (passport.country) lines.push(`Country: ${passport.country}`);
    lines.push(`Financial goal: ${passport.biggest_goal}`);
    if (passport.portfolio_interests) lines.push(`Portfolio interests: ${passport.portfolio_interests}`);
    if (passport.favorite_investments) lines.push(`Favorite investments: ${passport.favorite_investments}`);
    if (passport.last_topic_discussed) lines.push(`Last topic discussed: ${passport.last_topic_discussed}`);
  }

  lines.push(`Lessons completed: ${progress.length} of 20`);
  lines.push(`Knowledge scores: ${formatKnowledgeSummary(progress)}`);
  lines.push(`Weak areas (quiz below 70%): ${formatWeakAreasSummary(progress)}`);

  const last = lastCompletedLesson(progress);
  if (last) {
    const total = last.quiz_total || 1;
    const pct = Math.round(((last.quiz_score ?? 0) / total) * 100);
    const title = LESSON_TITLES[last.lesson_number] || `Lesson ${last.lesson_number}`;
    lines.push(`Most recent lesson: ${title} (${pct}% quiz score)`);
  }

  lines.push("=== END CONTEXT ===");
  return lines.join("\n");
}

export function buildWelcomePrompt(memory: UserMemory): string {
  const name = firstName(memory.profile?.full_name);
  const last = lastCompletedLesson(memory.progress);
  const passport = memory.passport;
  const hints: string[] = [`Greet ${name} warmly by first name.`];

  if (passport?.last_topic_discussed) {
    hints.push(`Reference that you last discussed: ${passport.last_topic_discussed}.`);
  }
  if (last) {
    const total = last.quiz_total || 1;
    const pct = Math.round(((last.quiz_score ?? 0) / total) * 100);
    const title = LESSON_TITLES[last.lesson_number] || `Lesson ${last.lesson_number}`;
    hints.push(`Mention their most recent lesson "${title}" where they scored ${pct}%.`);
  }
  const weak = computeWeakAreas(memory.progress, 1)[0];
  if (weak) {
    hints.push(`Optionally suggest reviewing ${weak.title} (${weak.pct}%) if they want to strengthen weak areas.`);
  }
  if (memory.progress.length === 0) {
    hints.push("They haven't completed any lessons yet — encourage them to start Lesson 1 or ask a question.");
  }

  hints.push("Keep it to 2–3 sentences. Sound like a mentor who remembers them, not a generic chatbot.");
  return hints.join(" ");
}

export function buildWelcomeFallback(memory: UserMemory): string {
  const name = firstName(memory.profile?.full_name);
  const parts = [`Welcome back, ${name}.`];

  if (memory.passport?.last_topic_discussed) {
    parts.push(`Last time we discussed ${memory.passport.last_topic_discussed}.`);
  }

  const last = lastCompletedLesson(memory.progress);
  if (last) {
    const total = last.quiz_total || 1;
    const pct = Math.round(((last.quiz_score ?? 0) / total) * 100);
    const title = LESSON_TITLES[last.lesson_number] || `Lesson ${last.lesson_number}`;
    parts.push(`You scored ${pct}% on ${title}.`);
  }

  parts.push("What would you like to work on today?");
  return parts.join(" ");
}

export function inferTopic(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "";
  const sentence = trimmed.split(/[.!?]/)[0];
  return sentence.length > 100 ? sentence.slice(0, 97) + "…" : sentence;
}

export { computeCategoryScores, computeWeakAreas, formatKnowledgeSummary };
