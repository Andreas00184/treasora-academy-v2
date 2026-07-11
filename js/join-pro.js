(function () {
  var pricingBox = document.getElementById("pricing-plans");
  var monthlyBtn = document.getElementById("join-pro-monthly-btn");
  var annualBtn = document.getElementById("join-pro-annual-btn");
  var manageBtn = document.getElementById("join-pro-manage-btn");
  var checkoutError = document.getElementById("checkout-error");
  if (!pricingBox || !monthlyBtn || !annualBtn) return;

  function t(key, vars) {
    return window.TreasoraI18n ? TreasoraI18n.t(key, vars) : key;
  }

  function setLoading(loading) {
    [monthlyBtn, annualBtn].forEach(function (btn) {
      btn.style.opacity = loading ? ".6" : "1";
      btn.style.pointerEvents = loading ? "none" : "";
    });
  }

  async function startCheckout(session, plan) {
    if (checkoutError) checkoutError.style.display = "none";
    setLoading(true);
    monthlyBtn.textContent = t("joinPro.redirectingCheckout");
    annualBtn.textContent = t("joinPro.redirectingCheckout");

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
      setLoading(false);
      monthlyBtn.textContent = t("joinPro.startMonthly");
      annualBtn.textContent = t("joinPro.startAnnual");
      if (checkoutError) {
        checkoutError.textContent = err.message || t("joinPro.checkoutError");
        checkoutError.style.display = "block";
      }
    }
  }

  async function openPortal(session) {
    if (checkoutError) checkoutError.style.display = "none";
    manageBtn.style.opacity = ".6";
    manageBtn.style.pointerEvents = "none";
    manageBtn.textContent = t("joinPro.openingPortal");

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
      manageBtn.style.opacity = "1";
      manageBtn.style.pointerEvents = "";
      manageBtn.textContent = t("joinPro.manageSubscription");
      if (checkoutError) {
        checkoutError.textContent = err.message || t("joinPro.portalError");
        checkoutError.style.display = "block";
      }
    }
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

    monthlyBtn.href = "#";
    annualBtn.href = "#";

    if (isPro && hasCustomer) {
      pricingBox.style.display = "none";
      if (manageBtn) {
        manageBtn.style.display = "inline-flex";
        manageBtn.href = "#";
        manageBtn.textContent = t("joinPro.manageSubscription");
        manageBtn.onclick = function (e) {
          e.preventDefault();
          openPortal(session);
        };
      }
    } else {
      pricingBox.style.display = "";
      if (manageBtn) manageBtn.style.display = "none";
      monthlyBtn.textContent = t("joinPro.startMonthly");
      annualBtn.textContent = t("joinPro.startAnnual");
      monthlyBtn.onclick = function (e) {
        e.preventDefault();
        startCheckout(session, "monthly");
      };
      annualBtn.onclick = function (e) {
        e.preventDefault();
        startCheckout(session, "annual");
      };
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
