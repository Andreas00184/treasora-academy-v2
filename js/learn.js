/**
 * Learn page: show completed lessons and overall progress.
 */
(function (global) {
  async function load() {
    if (!global.TreasoraLessonProgress) return;

    var progress = [];
    if (global.TreasoraSupabase && global.TreasoraSupabase.configured) {
      progress = await global.TreasoraLessonProgress.fetchProgress();
    }

    var completed = global.TreasoraLessonProgress.completedSet(progress);
    var count = global.TreasoraLessonProgress.countCompleted(progress);

    var fill = document.getElementById("overall-progress-fill");
    var label = document.getElementById("overall-progress-label");
    if (fill) fill.style.width = Math.round((count / 20) * 100) + "%";
    if (label) label.textContent = count + " of 20 lessons complete";

    document.querySelectorAll(".lesson-row").forEach(function (row) {
      var href = row.getAttribute("href") || "";
      var match = href.match(/lesson-(\d+)\.html/);
      if (!match) return;
      var num = parseInt(match[1], 10);
      if (completed[num]) {
        row.style.borderColor = "rgba(212,175,55,.45)";
        row.style.background = "rgba(212,175,55,.06)";
        var numEl = row.querySelector(".lesson-num");
        if (numEl) numEl.textContent = "✓";
        var arrow = row.querySelector(".lesson-arrow");
        if (arrow) arrow.textContent = "Done";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", load);
})(window);
