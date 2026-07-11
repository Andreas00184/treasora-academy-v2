/**
 * Subscription display and Stripe Billing Portal.
 */
(function (global) {
  function formatDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "—";
    }
  }

  function formatMoney(cents, currency) {
    currency = (currency || "usd").toUpperCase();
    var amount = (cents || 0) / 100;
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: currency }).format(amount);
    } catch (e) {
      return "$" + amount.toFixed(2);
    }
  }

  function formatStatus(status) {
    if (!status) return "—";
    return status.replace(/_/g, " ").replace(/\b\w/g, function (c) {
      return c.toUpperCase();
    });
  }

  function planLabel(profile) {
    if (!profile) return "Free";
    if (profile.current_plan === "pro" || profile.is_pro) return "Pro";
    return "Free";
  }

  async function fetchBillingHistory() {
    var client = global.TreasoraSupabase && global.TreasoraSupabase.client;
    if (!client) return [];
    var result = await client
      .from("billing_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12);
    if (result.error) {
      console.error("Billing history fetch error:", result.error);
      return [];
    }
    return result.data || [];
  }

  async function openBillingPortal(returnUrl) {
    if (!global.SUPABASE_CONFIGURED) {
      alert(t("billing.stripeNotConfigured"));
      return;
    }
    var session = await global.TreasoraAuth.getSession();
    if (!session) {
      window.location.href = "sign-in.html";
      return;
    }
    var res = await fetch(global.BILLING_PORTAL_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + session.access_token,
      },
      body: JSON.stringify({ returnUrl: returnUrl || window.location.href }),
    });
    var data = await res.json();
    if (!res.ok || !data.url) {
      throw new Error(data.error || "Could not open billing portal");
    }
    window.location.href = data.url;
  }

  function renderBillingHistory(container, rows) {
    if (!container) return;
    if (!rows.length) {
      container.innerHTML = '<p class="billing-empty">' + t("dashboard.noInvoices") + "</p>";
      return;
    }
    container.innerHTML =
      '<table class="billing-table"><thead><tr>' +
      "<th>Date</th><th>Description</th><th>Amount</th><th>Status</th><th></th>" +
      "</tr></thead><tbody>" +
      rows
        .map(function (row) {
          var date = formatDate(row.paid_at || row.created_at);
          var pdf = row.invoice_pdf_url
            ? '<a href="' +
              row.invoice_pdf_url +
              '" target="_blank" rel="noopener">PDF</a>'
            : "";
          return (
            "<tr>" +
            "<td>" +
            date +
            "</td>" +
            "<td>" +
            (row.description || "Treasora Pro") +
            "</td>" +
            "<td>" +
            formatMoney(row.amount_cents, row.currency) +
            "</td>" +
            "<td>" +
            formatStatus(row.status) +
            "</td>" +
            "<td>" +
            pdf +
            "</td>" +
            "</tr>"
          );
        })
        .join("") +
      "</tbody></table>";
  }

  function t(key, vars) {
    return global.TreasoraI18n ? global.TreasoraI18n.t(key, vars) : key;
  }

  function renderSubscriptionUI(profile, billingRows) {
    var planEl = document.getElementById("sub-plan");
    var statusEl = document.getElementById("sub-status");
    var renewalEl = document.getElementById("sub-renewal");
    var manageBtn = document.getElementById("manage-subscription-btn");
    var upgradeBtn = document.getElementById("upgrade-subscription-btn");
    var historyWrap = document.getElementById("billing-history-wrap");
    var historyEl = document.getElementById("billing-history");
    var kicker = document.querySelector(".hero .kicker");

    var isPro = profile && (profile.current_plan === "pro" || profile.is_pro);
    var hasCustomer = profile && profile.stripe_customer_id;

    if (planEl) planEl.textContent = isPro ? t("common.pro") : t("common.free");
    if (statusEl) {
      statusEl.textContent = isPro ? formatStatus(profile.subscription_status || "active") : t("dashboard.freeAccount");
    }
    if (renewalEl) {
      renewalEl.textContent = isPro && profile.renewal_date
        ? formatDate(profile.renewal_date)
        : "—";
    }

    if (kicker) {
      kicker.innerHTML = isPro
        ? '<span class="dot"></span> ' + t("dashboard.kickerPro")
        : '<span class="dot"></span> ' + t("dashboard.kickerFree");
    }

    if (manageBtn) {
      manageBtn.style.display = hasCustomer ? "inline-flex" : "none";
      manageBtn.textContent = t("dashboard.manageSubscription");
      manageBtn.onclick = async function () {
        manageBtn.disabled = true;
        manageBtn.textContent = t("dashboard.openingPortal");
        try {
          await openBillingPortal(window.location.origin + "/dashboard.html");
        } catch (err) {
          alert(err.message || t("billing.portalError"));
          manageBtn.disabled = false;
          manageBtn.textContent = t("dashboard.manageSubscription");
        }
      };
    }

    if (upgradeBtn) {
      upgradeBtn.style.display = !isPro ? "inline-flex" : "none";
      upgradeBtn.textContent = t("dashboard.upgradeToPro");
    }

    if (historyWrap && historyEl) {
      var historyTitle = historyWrap.querySelector("h3");
      if (historyTitle) historyTitle.textContent = t("dashboard.billingHistory");
      if (hasCustomer && billingRows.length) {
        historyWrap.style.display = "block";
        renderBillingHistory(historyEl, billingRows);
      } else {
        historyWrap.style.display = hasCustomer ? "block" : "none";
        if (historyEl) renderBillingHistory(historyEl, billingRows);
      }
    }
  }

  async function loadDashboardBilling(profile) {
    var rows = [];
    if (profile && profile.stripe_customer_id) {
      rows = await fetchBillingHistory();
    }
    renderSubscriptionUI(profile, rows);
  }

  function showUpgradeBanner() {
    var params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "1") {
      var hero = document.querySelector(".hero p");
      if (hero) hero.textContent = t("dashboard.leadUpgraded");
      history.replaceState(null, "", "dashboard.html");
    }
  }

  global.TreasoraBilling = {
    formatDate: formatDate,
    formatMoney: formatMoney,
    fetchBillingHistory: fetchBillingHistory,
    openBillingPortal: openBillingPortal,
    renderSubscriptionUI: renderSubscriptionUI,
    loadDashboardBilling: loadDashboardBilling,
    showUpgradeBanner: showUpgradeBanner,
  };
})(window);
