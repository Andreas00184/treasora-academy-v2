(function () {
  var monthlyBtn = document.getElementById("join-pro-monthly-btn");
  var annualBtn = document.getElementById("join-pro-annual-btn");
  var manageBtn = document.getElementById("join-pro-manage-btn");
  var checkoutError = document.getElementById("checkout-error");
  if (!monthlyBtn && !annualBtn) return;

  function t(key, vars) {
    return window.TreasoraI18n ? TreasoraI18n.t(key, vars) : key;
  }

  function setButtonLoading(btn, loadingText) {
    if (!btn) return;
    btn.style.opacity = ".6";
    btn.style.pointerEvents = "none";
    btn.dataset.defaultText = btn.dataset.defaultText || btn.textContent;
    btn.textContent = loadingText;
  }

  function resetButton(btn, textKey) {
    if (!btn) return;
    btn.style.opacity = "1";
    btn.style.pointerEvents = "";
    btn.textContent = t(textKey);
  }

  async function startCheckout(session, plan) {
    if (checkoutError) checkoutError.style.display = "none";
    setButtonLoading(monthlyBtn, t("joinPro.redirectingCheckout"));
    setButtonLoading(annualBtn, t("joinPro.redirectingCheckout"));

    try {
      var res = await fetch(CHECKOUT_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + session.access_token,
        },
        body: JSON.stringify({
          plan: plan,
          successUrl: window.location.origin + "/dashboard.html?upgraded=1",
          cancelUrl: window.location.origin + "/join-pro.html?canceled=1",
        }),
      });
      var data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || t("joinPro.checkoutError"));
      }
      window.location.href = data.url;
    } catch (err) {
      resetButton(monthlyBtn, "joinPro.startMonthly");
      resetButton(annualBtn, "joinPro.startAnnual");
      if (checkoutError) {
        checkoutError.textContent = err.message || t("joinPro.checkoutError");
        checkoutError.style.display = "block";
      }
    }
  }

  async function openPortal(session) {
    if (checkoutError) checkoutError.style.display = "none";
    setButtonLoading(manageBtn, t("joinPro.openingPortal"));

    try {
      var res = await fetch(BILLING_PORTAL_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + session.access_token,
        },
        body: JSON.stringify({ returnUrl: window.location.origin + "/join-pro.html" }),
      });
      var data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || t("joinPro.portalError"));
      }
      window.location.href = data.url;
    } catch (err) {
      resetButton(manageBtn, "joinPro.manageSubscription");
      if (checkoutError) {
        checkoutError.textContent = err.message || t("joinPro.portalError");
        checkoutError.style.display = "block";
      }
    }
  }

  function showCheckoutButtons(show) {
    var plansWrap = document.getElementById("pricing-plans");
    if (plansWrap) plansWrap.style.display = show ? "" : "none";
    if (manageBtn) manageBtn.style.display = show ? "none" : "inline-flex";
  }

  async function updateButtonsForSession() {
    if (window.TreasoraI18n) await TreasoraI18n.init();
    if (!window.SUPABASE_CONFIGURED) return;

    var sessionResult = await supabaseClient.auth.getSession();
    var session = sessionResult.data.session;
    if (!session) return;

    var profile = null;
    if (window.TreasoraAuth) {
      profile = await TreasoraAuth.getProfile();
    }

    var isPro = profile && (profile.is_pro || profile.current_plan === "pro");
    var hasCustomer = profile && profile.stripe_customer_id;

    if (monthlyBtn) monthlyBtn.href = "#";
    if (annualBtn) annualBtn.href = "#";

    if (isPro && hasCustomer) {
      showCheckoutButtons(false);
      if (manageBtn) {
        manageBtn.href = "#";
        manageBtn.textContent = t("joinPro.manageSubscription");
        manageBtn.onclick = function (e) {
          e.preventDefault();
          openPortal(session);
        };
      }
    } else {
      showCheckoutButtons(true);
      if (monthlyBtn) {
        monthlyBtn.textContent = t("joinPro.startMonthly");
        monthlyBtn.onclick = function (e) {
          e.preventDefault();
          startCheckout(session, "monthly");
        };
      }
      if (annualBtn) {
        annualBtn.textContent = t("joinPro.startAnnual");
        annualBtn.onclick = function (e) {
          e.preventDefault();
          startCheckout(session, "annual");
        };
      }
    }

    var params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "1" && checkoutError) {
      checkoutError.style.display = "block";
      checkoutError.style.color = "var(--gold2)";
      checkoutError.style.borderColor = "rgba(212,175,55,.35)";
      checkoutError.style.background = "rgba(212,175,55,.08)";
      checkoutError.textContent = t("joinPro.welcomePro");
      history.replaceState(null, "", "join-pro.html");
    }
    if (params.get("canceled") === "1" && checkoutError) {
      checkoutError.style.display = "block";
      checkoutError.textContent = t("joinPro.checkoutCanceled");
      history.replaceState(null, "", "join-pro.html");
    }
  }

  updateButtonsForSession();
  document.addEventListener("treasora:locale-changed", updateButtonsForSession);
})();
