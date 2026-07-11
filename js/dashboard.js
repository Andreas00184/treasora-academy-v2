/**
 * Dashboard: load progress, passport, and roadmap from Supabase.
 */
(function (global) {
  function t(key, vars) {
    return global.TreasoraI18n ? global.TreasoraI18n.t(key, vars) : key;
  }

  async function load() {
    if (global.TreasoraI18n) await global.TreasoraI18n.init();
    if (!global.TreasoraAuth || !global.TreasoraSupabase) return;
    var session = await global.TreasoraAuth.requireAuth("sign-in.html");
    if (!session) return;

    var user = session.user;
    var profile = await global.TreasoraAuth.getProfile();
    if (profile && profile.ui_language && global.TreasoraI18n) {
      await global.TreasoraI18n.setLocale(profile.ui_language, { persist: false });
    }

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
      "";
    var heroTitle = document.querySelector(".hero h1");
    if (heroTitle) {
      var fn = firstName(name) || t("common.back");
      heroTitle.innerHTML = t("dashboard.welcome", {
        name: '<span class="gold">' + escapeHtml(fn) + "</span>",
      });
    }

    var kicker = document.querySelector(".hero .kicker");
    if (kicker) {
      var isPro = profile && (profile.is_pro || profile.current_plan === "pro");
      kicker.innerHTML = isPro
        ? '<span class="dot"></span> ' + t("dashboard.kickerPro")
        : '<span class="dot"></span> ' + t("dashboard.kickerFree");
    }

    if (global.TreasoraBilling) {
      global.TreasoraBilling.showUpgradeBanner();
      await global.TreasoraBilling.loadDashboardBilling(profile);
    }

    var completed = global.TreasoraLessonProgress.countCompleted(progress);
    var progressValue = document.getElementById("progress-value");
    var progressFill = document.getElementById("progress-fill");
    if (progressValue) {
      progressValue.textContent = t("dashboard.lessonsComplete", { count: completed });
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
      continueBtn.textContent = t("dashboard.continueBtn", { num: nextNum });
      continueBtn.href = "lesson-" + nextNum + ".html";
    } else if (continueTitle && continueBtn) {
      continueTitle.textContent = t("dashboard.programComplete");
      continueBtn.textContent = t("dashboard.seeWhatsNext");
      continueBtn.href = "program-complete.html";
    }

    var phaseKeys = ["learn.phase1", "learn.phase2", "learn.phase3", "learn.phase4"];
    var roadmap = document.querySelector(".roadmap");
    if (roadmap) {
      var phases = global.TreasoraLessonProgress.PHASES;
      roadmap.innerHTML = phases
        .map(function (phase, idx) {
          var status = global.TreasoraLessonProgress.phaseStatus(progress, phase);
          var icon = status === "done" ? "✓" : status === "active" ? "●" : "🔒";
          var statusLabel =
            status === "done"
              ? t("common.complete")
              : status === "active"
                ? t("common.inProgress")
                : t("common.notStarted");
          return (
            '<div class="phase ' +
            status +
            '">' +
            '<div class="phase-icon">' +
            icon +
            "</div>" +
            '<div class="phase-info">' +
            '<div class="phase-title">' +
            t(phaseKeys[idx] || "learn.phase1") +
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

    if (global.TreasoraKnowledgeScore) {
      global.TreasoraKnowledgeScore.renderKnowledgeScores(
        document.getElementById("knowledge-scores"),
        progress
      );
      global.TreasoraKnowledgeScore.renderWeakAreas(
        document.getElementById("weak-areas"),
        progress
      );
    }
  }

  function setPassportCard(index, value) {
    var cards = document.querySelectorAll(".passport-grid .passport-card .pv");
    if (cards[index]) cards[index].textContent = value;
  }

  function firstName(fullName) {
    return String(fullName).trim().split(/\s+/)[0] || "";
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
  document.addEventListener("treasora:locale-changed", load);
})(window);
