(function () {
  var joinProBtn = document.getElementById("join-pro-btn");
  var checkoutError = document.getElementById("checkout-error");
  if (!joinProBtn) return;

  function t(key, vars) {
    return window.TreasoraI18n ? TreasoraI18n.t(key, vars) : key;
  }

  async function startCheckout(session) {
    if (checkoutError) checkoutError.style.display = "none";
    joinProBtn.style.opacity = ".6";
    joinProBtn.textContent = t("joinPro.redirectingCheckout");

    try {
      var res = await fetch(CHECKOUT_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + session.access_token,
        },
        body: JSON.stringify({
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
      joinProBtn.style.opacity = "1";
      joinProBtn.textContent = t("joinPro.startPro");
      if (checkoutError) {
        checkoutError.textContent = err.message || t("joinPro.checkoutError");
        checkoutError.style.display = "block";
      }
    }
  }

  async function openPortal(session) {
    if (checkoutError) checkoutError.style.display = "none";
    joinProBtn.style.opacity = ".6";
    joinProBtn.textContent = t("joinPro.openingPortal");

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
      joinProBtn.style.opacity = "1";
      joinProBtn.textContent = t("joinPro.manageSubscription");
      if (checkoutError) {
        checkoutError.textContent = err.message || t("joinPro.portalError");
        checkoutError.style.display = "block";
      }
    }
  }

  async function updateButtonForSession() {
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

    joinProBtn.href = "#";

    if (isPro && hasCustomer) {
      joinProBtn.textContent = t("joinPro.manageSubscription");
      joinProBtn.addEventListener("click", function (e) {
        e.preventDefault();
        openPortal(session);
      });
    } else {
      joinProBtn.textContent = t("joinPro.startPro");
      joinProBtn.addEventListener("click", function (e) {
        e.preventDefault();
        startCheckout(session);
      });
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

  updateButtonForSession();
  document.addEventListener("treasora:locale-changed", updateButtonForSession);
})();
