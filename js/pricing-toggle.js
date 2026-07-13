(function (global) {
  var PLANS = {
    monthly: {
      price: "$19.99",
      priceNoteKey: "joinPro.monthlyPriceNote",
      billingNoteKey: "joinPro.monthlyNote",
      savingsKey: null,
    },
    annual: {
      price: "$199.00",
      priceNoteKey: "joinPro.annualPriceNote",
      billingNoteKey: "joinPro.annualNote",
      savingsKey: "joinPro.annualSavings",
    },
  };

  function t(key) {
    return global.TreasoraI18n ? global.TreasoraI18n.t(key) : key;
  }

  function selectPlan(container, plan, options) {
    options = options || {};
    var cfg = PLANS[plan] || PLANS.monthly;

    container.querySelectorAll(".plan-toggle-btn").forEach(function (btn) {
      var isActive = btn.dataset.plan === plan;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    var priceEl = container.querySelector("#pro-price, [data-pro-price]");
    var noteEl = container.querySelector("#pro-price-note, [data-pro-price-note]");
    var savingsEl = container.querySelector("#pro-savings, [data-pro-savings]");
    var billingEl = container.querySelector("#pro-billing-note, [data-pro-billing-note]");
    var ctaEl = container.querySelector("#join-pro-checkout-btn, [data-pro-cta]");

    if (priceEl) priceEl.textContent = cfg.price;
    if (noteEl) noteEl.textContent = t(cfg.priceNoteKey);
    if (billingEl) billingEl.textContent = t(cfg.billingNoteKey);
    if (savingsEl) savingsEl.textContent = cfg.savingsKey ? t(cfg.savingsKey) : "";

    if (ctaEl && options.linkMode) {
      ctaEl.href = (options.linkBase || "join-pro.html") + "?plan=" + plan;
    }

    container.dataset.selectedPlan = plan;
  }

  function init(container, options) {
    if (!container) return null;
    options = options || {};

    var params = new URLSearchParams(window.location.search);
    var initial = options.initialPlan || params.get("plan") || "monthly";
    if (initial !== "annual") initial = "monthly";

    container.querySelectorAll(".plan-toggle-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectPlan(container, btn.dataset.plan, options);
      });
    });

    selectPlan(container, initial, options);

    return {
      getPlan: function () {
        return container.dataset.selectedPlan || "monthly";
      },
      selectPlan: function (plan) {
        selectPlan(container, plan, options);
      },
    };
  }

  global.TreasoraPricingToggle = { init: init, selectPlan: selectPlan };
})(window);
