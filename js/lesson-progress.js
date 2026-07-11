/**
 * Lesson progress: save completion and shared lesson metadata.
 */
(function (global) {
  var LESSON_TITLES = {
    1: "What Is Money?",
    2: "Why Do We Work? (and the Psychology of Money)",
    3: "Income vs Expenses",
    4: "Assets vs Liabilities",
    5: "Why Saving Money Matters",
    6: "How To Create A Budget",
    7: "Emergency Funds Explained",
    8: "Good Debt vs Bad Debt",
    9: "Banking Basics & Managing Accounts",
    10: "What Is Inflation?",
    11: "What Is The Financial Market?",
    12: "What Is A Stock Exchange?",
    13: "What Is A Stock?",
    14: "What Is A Bond?",
    15: "What Is An ETF?",
    16: "The Power of Compound Interest & Time in the Market",
    17: "What Is Diversification?",
    18: "Introduction To Retirement Planning",
    19: "Introduction To Digital Assets & Cryptocurrency",
    20: "Your Journey To Financial Freedom (Action Plan + Review)",
  };

  var PHASES = [
    { title: "Phase 1 · Understanding Money & Mindset", sub: "Lessons 1–5", start: 1, end: 5 },
    { title: "Phase 2 · Building Financial Foundations", sub: "Lessons 6–10", start: 6, end: 10 },
    { title: "Phase 3 · Understanding Financial Markets", sub: "Lessons 11–15", start: 11, end: 15 },
    { title: "Phase 4 · Building Wealth & Next Steps", sub: "Lessons 16–20", start: 16, end: 20 },
  ];

  function getClient() {
    return global.TreasoraSupabase && global.TreasoraSupabase.client;
  }

  async function fetchProgress() {
    var client = getClient();
    if (!client) return [];
    var session = await global.TreasoraAuth.getSession();
    if (!session) return [];
    var result = await client
      .from("lesson_progress")
      .select("lesson_number, quiz_score, quiz_total, completed_at")
      .order("lesson_number", { ascending: true });
    if (result.error) {
      console.error("Progress fetch error:", result.error);
      return [];
    }
    return result.data || [];
  }

  async function saveCompletion(lessonNumber, quizScore, quizTotal) {
    var client = getClient();
    if (!client || !global.TreasoraSupabase.configured) return { ok: false, reason: "not_configured" };
    var session = await global.TreasoraAuth.getSession();
    if (!session) return { ok: false, reason: "not_signed_in" };

    var result = await client.from("lesson_progress").upsert(
      {
        user_id: session.user.id,
        lesson_number: lessonNumber,
        quiz_score: quizScore,
        quiz_total: quizTotal,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_number" }
    );

    if (result.error) {
      console.error("Progress save error:", result.error);
      return { ok: false, reason: result.error.message };
    }
    return { ok: true };
  }

  function completedSet(progressRows) {
    var set = {};
    (progressRows || []).forEach(function (row) {
      set[row.lesson_number] = row;
    });
    return set;
  }

  function countCompleted(progressRows) {
    return (progressRows || []).length;
  }

  function nextLessonNumber(progressRows) {
    var done = completedSet(progressRows);
    for (var i = 1; i <= 20; i++) {
      if (!done[i]) return i;
    }
    return null;
  }

  function phaseStatus(progressRows, phase) {
    var done = completedSet(progressRows);
    var completedInPhase = 0;
    for (var n = phase.start; n <= phase.end; n++) {
      if (done[n]) completedInPhase++;
    }
    var total = phase.end - phase.start + 1;
    if (completedInPhase === 0) return "locked";
    if (completedInPhase === total) return "done";
    return "active";
  }

  function initLessonPage(lessonNumber) {
    document.addEventListener("treasora:lesson-complete", async function (ev) {
      var detail = ev.detail || {};
      await saveCompletion(
        detail.lesson || lessonNumber,
        detail.quizScore,
        detail.quizTotal
      );
    });
  }

  global.TreasoraLessonProgress = {
    LESSON_TITLES: LESSON_TITLES,
    PHASES: PHASES,
    fetchProgress: fetchProgress,
    saveCompletion: saveCompletion,
    completedSet: completedSet,
    countCompleted: countCompleted,
    nextLessonNumber: nextLessonNumber,
    phaseStatus: phaseStatus,
    initLessonPage: initLessonPage,
  };
})(window);
