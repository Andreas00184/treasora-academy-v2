/**
 * Knowledge Score: category mapping and score computation for the dashboard.
 */
(function (global) {
  var LESSON_TITLES = global.TreasoraLessonProgress
    ? global.TreasoraLessonProgress.LESSON_TITLES
    : {};

  var CATEGORIES = [
    { id: "money_basics", label: "Money Basics", lessons: [1, 2, 3, 4, 5] },
    { id: "budgeting", label: "Budgeting", lessons: [6, 7, 8, 9, 10] },
    { id: "investing", label: "Investing", lessons: [11, 12, 13, 14, 15] },
    { id: "taxes", label: "Taxes", lessons: [] },
    { id: "retirement", label: "Retirement", lessons: [16, 17, 18] },
    { id: "crypto", label: "Crypto", lessons: [19, 20] },
  ];

  function progressMap(rows) {
    var map = {};
    (rows || []).forEach(function (row) {
      map[row.lesson_number] = row;
    });
    return map;
  }

  function computeCategoryScores(rows) {
    var done = progressMap(rows);
    return CATEGORIES.map(function (cat) {
      if (!cat.lessons.length) {
        return {
          id: cat.id,
          label: cat.label,
          score: null,
          completedLessons: 0,
          totalLessons: 0,
        };
      }
      var sum = 0;
      var count = 0;
      var completed = 0;
      cat.lessons.forEach(function (n) {
        var row = done[n];
        if (!row) return;
        completed++;
        var total = row.quiz_total || 1;
        var score = row.quiz_score != null ? row.quiz_score : 0;
        sum += Math.round((score / total) * 100);
        count++;
      });
      return {
        id: cat.id,
        label: cat.label,
        score: count > 0 ? Math.round(sum / count) : 0,
        completedLessons: completed,
        totalLessons: cat.lessons.length,
      };
    });
  }

  function computeWeakAreas(rows, limit) {
    limit = limit || 3;
    var weak = [];
    (rows || []).forEach(function (row) {
      var total = row.quiz_total || 1;
      var score = row.quiz_score != null ? row.quiz_score : 0;
      var pct = Math.round((score / total) * 100);
      if (pct < 70) {
        var title = LESSON_TITLES[row.lesson_number] || "Lesson " + row.lesson_number;
        weak.push({ lessonNumber: row.lesson_number, title: title, pct: pct });
      }
    });
    weak.sort(function (a, b) {
      return a.pct - b.pct;
    });
    return weak.slice(0, limit);
  }

  function renderKnowledgeScores(container, rows) {
    if (!container) return;
    var scores = computeCategoryScores(rows);
    container.innerHTML = scores
      .map(function (cat) {
        var pct = cat.score;
        var label =
          cat.totalLessons === 0
            ? (global.TreasoraI18n ? global.TreasoraI18n.t("common.comingSoon") : "Coming soon")
            : cat.completedLessons === 0
              ? (global.TreasoraI18n ? global.TreasoraI18n.t("common.notStarted") : "Not Started")
              : pct + "%";
        var width = cat.totalLessons === 0 ? 0 : cat.completedLessons === 0 ? 0 : pct;
        return (
          '<div class="knowledge-row">' +
          '<div class="knowledge-label">' +
          cat.label +
          "</div>" +
          '<div class="knowledge-bar-track">' +
          '<div class="knowledge-bar-fill" style="width:' +
          width +
          '%"></div>' +
          "</div>" +
          '<div class="knowledge-pct">' +
          label +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderWeakAreas(container, rows) {
    if (!container) return;
    var weak = computeWeakAreas(rows);
    if (!weak.length) {
      container.innerHTML =
        '<p class="weak-none">' +
        (global.TreasoraI18n ? global.TreasoraI18n.t("dashboard.noWeakAreas") : "No weak areas yet") +
        "</p>";
      return;
    }
    container.innerHTML =
      '<ul class="weak-list">' +
      weak
        .map(function (w) {
          return (
            '<li><a href="lesson-' +
            w.lessonNumber +
            '.html">' +
            w.title +
            "</a> · " +
            w.pct +
            "%</li>"
          );
        })
        .join("") +
      "</ul>";
  }

  global.TreasoraKnowledgeScore = {
    CATEGORIES: CATEGORIES,
    computeCategoryScores: computeCategoryScores,
    computeWeakAreas: computeWeakAreas,
    renderKnowledgeScores: renderKnowledgeScores,
    renderWeakAreas: renderWeakAreas,
  };
})(window);
