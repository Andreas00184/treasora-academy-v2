/**
 * Boot i18n on every page. Loads before page-specific scripts that use TreasoraI18n.t().
 */
(function () {
  function boot() {
    if (window.TreasoraI18n) {
      window.TreasoraI18n.init().catch(function (err) {
        console.error("i18n init failed:", err);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  document.addEventListener("treasora:locale-changed", function () {
    if (window.TreasoraI18n) TreasoraI18n.applyTranslations(document);
  });
})();
