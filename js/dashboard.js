/**
 * Dashboard: load progress, passport, and roadmap from Supabase.
 */
(function (global) {
  async function load() {
    if (!global.TreasoraAuth || !global.TreasoraSupabase) return;
    var session = await global.TreasoraAuth.requireAuth("sign-in.html");
    if (!session) return;

    var user = session.user;
    var profile = await global.TreasoraAuth.getProfile();
    var progress = await global.TreasoraLessonProgress.fetchProgress();
    var client = global.TreasoraSupabase.client;

    var passport = null;
    if (client) {
      var passResult = await client
        .from("financial_passports")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!passResult.error) passport = passResult.data;
    }

    var name =
      (user.user_metadata && user.user_metadata.full_name) ||
      (profile && profile.full_name) ||
      "back";
    var heroTitle = document.querySelector(".hero h1");
    if (heroTitle) {
      heroTitle.innerHTML = 'Welcome <span class="gold">' + escapeHtml(firstName(name)) + ".</span>";
    }

    var kicker = document.querySelector(".hero .kicker");
    if (kicker && profile && profile.is_pro) {
      kicker.innerHTML = '<span class="dot"></span> Pro Member';
    }

    var completed = global.TreasoraLessonProgress.countCompleted(progress);
    var progressValue = document.getElementById("progress-value");
    var progressFill = document.getElementById("progress-fill");
    if (progressValue) {
      progressValue.textContent = completed + " of 20 lessons complete";
    }
    if (progressFill) {
      progressFill.style.width = Math.round((completed / 20) * 100) + "%";
    }

    var nextNum = global.TreasoraLessonProgress.nextLessonNumber(progress);
    var continueTitle = document.querySelector(".continue-info .ct");
    var continueBtn = document.querySelector(".continue-row .btn");
    if (nextNum && continueTitle && continueBtn) {
      var title = global.TreasoraLessonProgress.LESSON_TITLES[nextNum];
      continueTitle.textContent = "Lesson " + nextNum + " · " + title;
      continueBtn.textContent = "Continue Lesson " + nextNum + " →";
      continueBtn.href = "lesson-" + nextNum + ".html";
    } else if (continueTitle && continueBtn) {
      continueTitle.textContent = "Foundation Program complete!";
      continueBtn.textContent = "See What's Next →";
      continueBtn.href = "program-complete.html";
    }

    var roadmap = document.querySelector(".roadmap");
    if (roadmap) {
      var phases = global.TreasoraLessonProgress.PHASES;
      roadmap.innerHTML = phases
        .map(function (phase) {
          var status = global.TreasoraLessonProgress.phaseStatus(progress, phase);
          var icon = status === "done" ? "✓" : status === "active" ? "●" : "🔒";
          var statusLabel =
            status === "done" ? "Complete" : status === "active" ? "In progress" : "Not started";
          return (
            '<div class="phase ' +
            status +
            '">' +
            '<div class="phase-icon">' +
            icon +
            "</div>" +
            '<div class="phase-info">' +
            '<div class="phase-title">' +
            phase.title +
            "</div>" +
            '<div class="phase-sub">' +
            phase.sub +
            "</div>" +
            "</div>" +
            '<div class="phase-status">' +
            statusLabel +
            "</div>" +
            "</div>"
          );
        })
        .join("");
    }

    if (passport) {
      setPassportCard(0, "🎯 " + truncate(passport.biggest_goal, 48));
      setPassportCard(1, passport.knowledge_level);
      setPassportCard(2, passport.learning_pace);
      setPassportCard(3, passport.preferred_language);
    }
  }

  function setPassportCard(index, value) {
    var cards = document.querySelectorAll(".passport-card .pv");
    if (cards[index]) cards[index].textContent = value;
  }

  function firstName(fullName) {
    return String(fullName).trim().split(/\s+/)[0] || "back";
  }

  function truncate(str, max) {
    str = String(str || "");
    return str.length > max ? str.slice(0, max - 1) + "…" : str;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  document.addEventListener("DOMContentLoaded", load);
})(window);
