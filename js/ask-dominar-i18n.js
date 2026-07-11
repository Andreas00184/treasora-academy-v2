/**
 * Ask Dominar UI strings — refresh on locale change.
 */
(function (global) {
  var FREE_LIMIT = 5;

  function t(key, vars) {
    return global.TreasoraI18n ? global.TreasoraI18n.t(key, vars) : key;
  }

  function updateQuotaDisplay(quotaLeft, isPro) {
    var quotaEl = document.querySelector(".quota-text");
    var upgradeEl = document.querySelector(".quota-upgrade");
    if (!quotaEl) return;
    if (isPro) {
      quotaEl.innerHTML = t("askDominar.quotaPro");
    } else {
      quotaEl.innerHTML = t("askDominar.quotaFree", {
        left: Math.max(quotaLeft, 0),
        limit: FREE_LIMIT,
      });
    }
    if (upgradeEl) upgradeEl.textContent = t("askDominar.upgradeLink");
  }

  function applyStaticStrings() {
    var emptyH1 = document.querySelector("#empty-state h1");
    if (emptyH1) emptyH1.innerHTML = t("askDominar.emptyHeadingHtml");
    var emptyP = document.querySelector("#empty-state p");
    if (emptyP) emptyP.textContent = t("askDominar.emptyBody");
    var input = document.getElementById("chat-input");
    if (input) input.placeholder = t("askDominar.placeholder");
    var note = document.querySelector(".composer-note");
    if (note) note.textContent = t("askDominar.composerNote");
    var attach = document.getElementById("attach-btn");
    if (attach) {
      attach.title = t("askDominar.attachTitle");
      attach.setAttribute("aria-label", t("askDominar.attachTitle"));
    }
    var mic = document.getElementById("mic-btn");
    if (mic) {
      mic.title = t("askDominar.micTitle");
      mic.setAttribute("aria-label", t("askDominar.micTitle"));
    }
    var send = document.getElementById("send-btn");
    if (send) send.setAttribute("aria-label", t("askDominar.sendLabel"));
    document.body.setAttribute("data-i18n-page-title", "askDominar.title");
    if (global.TreasoraI18n) {
      document.title = t("askDominar.title");
    }
  }

  global.TreasoraAskDominarI18n = {
    FREE_LIMIT: FREE_LIMIT,
    applyStaticStrings: applyStaticStrings,
    updateQuotaDisplay: updateQuotaDisplay,
  };

  document.addEventListener("treasora:locale-changed", function () {
    applyStaticStrings();
    if (typeof global.__treasoraQuotaLeft === "number") {
      updateQuotaDisplay(global.__treasoraQuotaLeft, global.__treasoraIsPro);
    }
  });
})(window);
