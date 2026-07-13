/**
 * Treasora Academy — shared navigation + footer language selector.
 * Guest: Home, Learn, Ask Dominar, Join Pro, Sign In
 * Signed in: Dashboard, Learn, Ask Dominar, Profile menu
 */
(function (global) {
  var PUBLIC_LOCALES = ["en", "es"];
  var FOOTER_LOCALE_LABELS = {
    en: "🇺🇸 English",
    es: "🇪🇸 Español",
  };

  var GUEST_LINKS = [
    { href: "index.html", key: "nav.home", match: /^(index\.html)?$/ },
    { href: "learn.html", key: "nav.learn", match: /^learn\.html$/ },
    { href: "ask-dominar.html", key: "nav.askDominar", match: /^ask-dominar\.html$/ },
    { href: "join-pro.html", key: "nav.joinPro", match: /^join-pro\.html$/, className: "pro" },
    { href: "sign-in.html", key: "nav.signIn", match: /^sign-in\.html$/, className: "signin" },
  ];

  var AUTH_LINKS = [
    { href: "dashboard.html", key: "nav.dashboard", match: /^dashboard\.html$/ },
    { href: "learn.html", key: "nav.learn", match: /^learn\.html$/ },
    { href: "ask-dominar.html", key: "nav.askDominar", match: /^ask-dominar\.html$/ },
  ];

  var PROFILE_PAGES = /^(passport|settings)\.html$/;

  function t(key) {
    return global.TreasoraI18n ? global.TreasoraI18n.t(key) : key;
  }

  function getPageName() {
    var parts = window.location.pathname.split("/");
    return parts[parts.length - 1] || "index.html";
  }

  function isCurrent(match) {
    var page = getPageName();
    if (page === "" || page === "/") page = "index.html";
    return match.test(page);
  }

  function createLink(item) {
    var link = document.createElement("a");
    link.href = item.href;
    link.setAttribute("data-i18n", item.key);
    link.textContent = t(item.key);
    if (item.className) link.className = item.className;
    if (isCurrent(item.match)) link.classList.add("current");
    return link;
  }

  function closeProfileMenu(wrap) {
    var btn = wrap.querySelector(".nav-profile-btn");
    var menu = wrap.querySelector(".nav-profile-menu");
    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute("aria-expanded", "false");
    wrap.classList.remove("open");
  }

  function closeAllProfileMenus() {
    document.querySelectorAll(".nav-profile-wrap.open").forEach(closeProfileMenu);
  }

  async function switchLocale(code) {
    if (!global.TreasoraI18n) return;
    var session = null;
    if (global.TreasoraAuth && global.TreasoraSupabase && global.TreasoraSupabase.configured) {
      try {
        session = await global.TreasoraAuth.getSession();
      } catch (e) {
        session = null;
      }
    }
    if (session) {
      await global.TreasoraI18n.saveLocaleToProfile(code);
    } else {
      await global.TreasoraI18n.setLocale(code);
    }
    updateLangButtons();
  }

  function updateLangButtons() {
    var locale = global.TreasoraI18n ? global.TreasoraI18n.getLocale() : "en";
    document.querySelectorAll("[data-locale]").forEach(function (el) {
      el.classList.toggle("active", el.getAttribute("data-locale") === locale);
    });
  }

  function appendLocaleButtons(container, className) {
    PUBLIC_LOCALES.forEach(function (code, index) {
      if (index > 0) {
        var sep = document.createElement("span");
        sep.className = className + "-sep";
        sep.textContent = "|";
        sep.setAttribute("aria-hidden", "true");
        container.appendChild(sep);
      }
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = className;
      btn.setAttribute("data-locale", code);
      btn.textContent = FOOTER_LOCALE_LABELS[code];
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        switchLocale(code);
      });
      container.appendChild(btn);
    });
  }

  function renderProfileMenu() {
    var wrap = document.createElement("div");
    wrap.className = "nav-profile-wrap";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-profile-btn";
    btn.setAttribute("aria-haspopup", "true");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML =
      '<span data-i18n="nav.profile">' +
      t("nav.profile") +
      '</span><span class="nav-profile-chevron" aria-hidden="true">▾</span>';

    if (isCurrent(PROFILE_PAGES)) btn.classList.add("current");

    var menu = document.createElement("div");
    menu.className = "nav-profile-menu";
    menu.setAttribute("role", "menu");
    menu.hidden = true;

    [
      { href: "passport.html", key: "nav.passport" },
      { href: "settings.html", key: "nav.settings" },
    ].forEach(function (item) {
      var link = document.createElement("a");
      link.href = item.href;
      link.className = "nav-profile-item";
      link.setAttribute("data-i18n", item.key);
      link.setAttribute("role", "menuitem");
      link.textContent = t(item.key);
      menu.appendChild(link);
    });

    var langRow = document.createElement("div");
    langRow.className = "nav-profile-lang";
    langRow.setAttribute("role", "none");
    var langLabel = document.createElement("span");
    langLabel.className = "nav-profile-lang-label";
    langLabel.setAttribute("data-i18n", "footer.language");
    langLabel.textContent = t("footer.language");
    langRow.appendChild(langLabel);
    var langOptions = document.createElement("div");
    langOptions.className = "nav-profile-lang-options";
    appendLocaleButtons(langOptions, "nav-lang-btn");
    langRow.appendChild(langOptions);
    menu.appendChild(langRow);

    var billingBtn = document.createElement("button");
    billingBtn.type = "button";
    billingBtn.className = "nav-profile-item";
    billingBtn.setAttribute("data-i18n", "nav.billing");
    billingBtn.setAttribute("role", "menuitem");
    billingBtn.textContent = t("nav.billing");
    billingBtn.addEventListener("click", async function () {
      closeProfileMenu(wrap);
      var profile =
        global.TreasoraAuth && (await global.TreasoraAuth.getProfile());
      if (profile && profile.stripe_customer_id && global.TreasoraBilling) {
        global.TreasoraBilling.openBillingPortal(window.location.href);
      } else {
        window.location.href = "settings.html";
      }
    });
    menu.appendChild(billingBtn);

    var logoutBtn = document.createElement("button");
    logoutBtn.type = "button";
    logoutBtn.className = "nav-profile-item nav-profile-logout";
    logoutBtn.setAttribute("data-i18n", "nav.logout");
    logoutBtn.setAttribute("role", "menuitem");
    logoutBtn.textContent = t("nav.logout");
    logoutBtn.addEventListener("click", function () {
      if (global.TreasoraAuth) global.TreasoraAuth.signOut();
    });
    menu.appendChild(logoutBtn);

    btn.addEventListener("click", function (event) {
      event.stopPropagation();
      var willOpen = menu.hidden;
      closeAllProfileMenus();
      if (willOpen) {
        menu.hidden = false;
        btn.setAttribute("aria-expanded", "true");
        wrap.classList.add("open");
      }
    });

    wrap.addEventListener("click", function (event) {
      event.stopPropagation();
    });

    wrap.appendChild(btn);
    wrap.appendChild(menu);
    return wrap;
  }

  async function renderNav() {
    var nav = document.getElementById("site-nav");
    if (!nav) return;

    var isAuthed = false;
    if (global.TreasoraAuth && global.TreasoraSupabase && global.TreasoraSupabase.configured) {
      try {
        isAuthed = !!(await global.TreasoraAuth.getSession());
      } catch (e) {
        isAuthed = false;
      }
    }

    nav.innerHTML = "";
    var links = isAuthed ? AUTH_LINKS : GUEST_LINKS;
    links.forEach(function (item) {
      nav.appendChild(createLink(item));
    });
    if (isAuthed) nav.appendChild(renderProfileMenu());

    if (global.TreasoraI18n) global.TreasoraI18n.applyTranslations(nav);
    updateLangButtons();
  }

  function renderFooterLang() {
    var bar = document.getElementById("footer-lang-bar");
    if (!bar) return;

    bar.innerHTML = "";
    var label = document.createElement("span");
    label.className = "footer-lang-label";
    label.setAttribute("data-i18n", "footer.language");
    label.textContent = t("footer.language");

    var options = document.createElement("div");
    options.className = "footer-lang-options";
    appendLocaleButtons(options, "footer-lang-btn");

    bar.appendChild(label);
    bar.appendChild(options);

    if (global.TreasoraI18n) global.TreasoraI18n.applyTranslations(bar);
    updateLangButtons();
  }

  async function init() {
    if (global.TreasoraI18n) {
      try {
        await global.TreasoraI18n.init();
      } catch (e) {
        console.warn("nav: i18n init failed", e);
      }
    }

    await renderNav();
    renderFooterLang();

    document.addEventListener("click", closeAllProfileMenus);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeAllProfileMenus();
    });

    global.addEventListener("treasora:locale-changed", function () {
      if (global.TreasoraI18n) global.TreasoraI18n.applyTranslations(document);
      updateLangButtons();
    });

    if (global.TreasoraSupabase && global.TreasoraSupabase.client) {
      global.TreasoraSupabase.client.auth.onAuthStateChange(function () {
        renderNav();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  global.TreasoraNav = {
    renderNav: renderNav,
    renderFooterLang: renderFooterLang,
    switchLocale: switchLocale,
  };
})(window);
