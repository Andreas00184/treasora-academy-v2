/**
 * Treasora Academy — shared navigation + footer language selector.
 * Fixed top nav: Home, Learn, Ask Dominar, Dashboard, Join Pro, Sign In, Contact
 */
(function (global) {
  var PUBLIC_LOCALES = ["en", "es"];
  var FOOTER_LOCALE_LABELS = {
    en: "🇺🇸 English",
    es: "🇪🇸 Español",
  };

  var NAV_LINKS = [
    { href: "index.html", key: "nav.home", match: /^(index\.html)?$/ },
    { href: "learn.html", key: "nav.learn", match: /^learn\.html$/ },
    { href: "ask-dominar.html", key: "nav.askDominar", match: /^ask-dominar\.html$/ },
    { href: "dashboard.html", key: "nav.dashboard", match: /^dashboard\.html$/ },
    { href: "join-pro.html", key: "nav.joinPro", match: /^join-pro\.html$/, className: "pro" },
    { href: "sign-in.html", key: "nav.signIn", match: /^sign-in\.html$/, className: "signin" },
    { href: "contact.html", key: "nav.contact", match: /^contact\.html$/ },
  ];

  function t(key) {
    return global.TreasoraI18n ? global.TreasoraI18n.t(key) : key;
  }

  function getPageName() {
    var parts = window.location.pathname.split("/");
    var page = parts[parts.length - 1] || "index.html";
    if (page === "" || page === "/") page = "index.html";
    return page;
  }

  function isCurrent(match) {
    return match.test(getPageName());
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
    document.querySelectorAll(".footer-lang-btn[data-locale]").forEach(function (el) {
      el.classList.toggle("active", el.getAttribute("data-locale") === locale);
    });
  }

  function wireFooterLang() {
    var bar = document.getElementById("footer-lang-bar");
    if (!bar || bar.dataset.wired === "1") return;
    bar.dataset.wired = "1";
    bar.addEventListener("click", function (event) {
      var btn = event.target.closest(".footer-lang-btn[data-locale]");
      if (!btn) return;
      switchLocale(btn.getAttribute("data-locale"));
    });
  }

  function ensureFooterLangMarkup() {
    var bar = document.getElementById("footer-lang-bar");
    if (!bar) return;

    if (!bar.querySelector(".footer-lang-options")) {
      bar.innerHTML =
        '<span class="footer-lang-label" data-i18n="footer.language">' +
        t("footer.language") +
        '</span><div class="footer-lang-options">' +
        '<button type="button" class="footer-lang-btn" data-locale="en">' +
        FOOTER_LOCALE_LABELS.en +
        '</button><span class="footer-lang-sep" aria-hidden="true">|</span>' +
        '<button type="button" class="footer-lang-btn" data-locale="es">' +
        FOOTER_LOCALE_LABELS.es +
        "</button></div>";
    }

    if (global.TreasoraI18n) global.TreasoraI18n.applyTranslations(bar);
    wireFooterLang();
    updateLangButtons();
  }

  function renderNav() {
    var nav = document.getElementById("site-nav");
    if (!nav) return;

    nav.innerHTML = "";
    NAV_LINKS.forEach(function (item) {
      nav.appendChild(createLink(item));
    });

    if (global.TreasoraI18n) global.TreasoraI18n.applyTranslations(nav);
  }

  async function init() {
    if (global.TreasoraI18n) {
      try {
        await global.TreasoraI18n.init();
      } catch (e) {
        console.warn("nav: i18n init failed", e);
      }
    }

    renderNav();
    ensureFooterLangMarkup();

    global.addEventListener("treasora:locale-changed", function () {
      if (global.TreasoraI18n) global.TreasoraI18n.applyTranslations(document);
      updateLangButtons();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  global.TreasoraNav = {
    renderNav: renderNav,
    ensureFooterLangMarkup: ensureFooterLangMarkup,
    switchLocale: switchLocale,
  };
})(window);
