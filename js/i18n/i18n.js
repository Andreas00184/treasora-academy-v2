/**
 * Treasora Academy — lightweight i18n (static JSON catalogs).
 * Brand names (Treasora Academy, Dominar, Financial Passport) stay untranslated in locale files.
 */
(function (global) {
  var SUPPORTED = ["en", "it", "es"];
  var STORAGE_KEY = "treasora_locale";
  var DEFAULT_LOCALE = "en";
  var catalogs = {};
  var currentLocale = DEFAULT_LOCALE;
  var ready = false;
  var initPromise = null;

  var LOCALE_LABELS = {
    en: "English",
    it: "Italiano",
    es: "Español",
  };

  var PASSPORT_LANGUAGE_MAP = {
    en: "English",
    it: "Italian",
    es: "Spanish",
  };

  function normalizeLocale(code) {
    if (!code) return DEFAULT_LOCALE;
    code = String(code).toLowerCase().split("-")[0];
    return SUPPORTED.indexOf(code) >= 0 ? code : DEFAULT_LOCALE;
  }

  function getNested(obj, key) {
    var parts = key.split(".");
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null || typeof cur !== "object") return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function interpolate(str, vars) {
    if (!vars || typeof str !== "string") return str;
    return str.replace(/\{\{(\w+)\}\}/g, function (_, k) {
      return vars[k] != null ? String(vars[k]) : "";
    });
  }

  async function loadCatalog(locale) {
    locale = normalizeLocale(locale);
    if (catalogs[locale]) return catalogs[locale];
    var res = await fetch("js/i18n/locales/" + locale + ".json");
    if (!res.ok) throw new Error("Failed to load locale: " + locale);
    catalogs[locale] = await res.json();
    return catalogs[locale];
  }

  function t(key, vars) {
    var str =
      getNested(catalogs[currentLocale], key) ||
      getNested(catalogs[DEFAULT_LOCALE], key) ||
      key;
    if (typeof str !== "string") return key;
    return interpolate(str, vars);
  }

  function applyTranslations(root) {
    root = root || document;
    root.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (!key) return;
      el.textContent = t(key);
    });
    root.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      if (!key) return;
      el.innerHTML = t(key);
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (key) el.placeholder = t(key);
    });
    root.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (key) el.setAttribute("aria-label", t(key));
    });
    root.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-title");
      if (key) el.title = t(key);
    });
    var titleKey = document.body && document.body.getAttribute("data-i18n-page-title");
    if (titleKey) document.title = t(titleKey);
  }

  async function resolveLocale() {
    var locale = normalizeLocale(localStorage.getItem(STORAGE_KEY));

    if (global.TreasoraAuth && global.TreasoraSupabase && global.TreasoraSupabase.configured) {
      try {
        var session = await global.TreasoraAuth.getSession();
        if (session) {
          var profile = await global.TreasoraAuth.getProfile();
          if (profile && profile.ui_language) {
            locale = normalizeLocale(profile.ui_language);
          }
        }
      } catch (e) {
        console.warn("Could not load profile language:", e);
      }
    }

    return locale;
  }

  async function setLocale(locale, opts) {
    opts = opts || {};
    locale = normalizeLocale(locale);
    await loadCatalog(DEFAULT_LOCALE);
    if (locale !== DEFAULT_LOCALE) {
      try {
        await loadCatalog(locale);
      } catch (e) {
        console.error(e);
        locale = DEFAULT_LOCALE;
      }
    }
    currentLocale = locale;
    document.documentElement.lang = locale;
    applyTranslations(document);
    ready = true;
    if (opts.persist !== false) {
      localStorage.setItem(STORAGE_KEY, locale);
    }
    global.dispatchEvent(
      new CustomEvent("treasora:locale-changed", { detail: { locale: locale } })
    );
    return locale;
  }

  async function saveLocaleToProfile(locale) {
    locale = normalizeLocale(locale);
    if (!global.TreasoraSupabase || !global.TreasoraSupabase.configured) {
      localStorage.setItem(STORAGE_KEY, locale);
      return { ok: false, reason: "not_configured" };
    }
    var session = await global.TreasoraAuth.getSession();
    if (!session) return { ok: false, reason: "not_signed_in" };

    var client = global.TreasoraSupabase.client;
    var profileUpdate = await client
      .from("profiles")
      .update({ ui_language: locale, updated_at: new Date().toISOString() })
      .eq("id", session.user.id);

    if (profileUpdate.error) {
      console.error(profileUpdate.error);
      return { ok: false, reason: profileUpdate.error.message };
    }

    var passportLang = PASSPORT_LANGUAGE_MAP[locale];
    if (passportLang) {
      await client
        .from("financial_passports")
        .update({ preferred_language: passportLang })
        .eq("user_id", session.user.id);
    }

    await setLocale(locale, { persist: true });
    return { ok: true };
  }

  async function init() {
    if (initPromise) return initPromise;
    initPromise = (async function () {
      var locale = await resolveLocale();
      await setLocale(locale, { persist: false });
    })();
    return initPromise;
  }

  function getLocale() {
    return currentLocale;
  }

  function isReady() {
    return ready;
  }

  function languageName(code) {
    code = normalizeLocale(code || currentLocale);
    return LOCALE_LABELS[code] || LOCALE_LABELS.en;
  }

  function openAiLanguageInstruction(code) {
    code = normalizeLocale(code || currentLocale);
    var names = { en: "English", it: "Italian", es: "Spanish" };
    return (
      "IMPORTANT: Always respond in " +
      (names[code] || "English") +
      ". The user's selected interface language is " +
      code +
      ". If they write in another language, still prefer " +
      (names[code] || "English") +
      " unless they explicitly ask to switch."
    );
  }

  global.TreasoraI18n = {
    SUPPORTED: SUPPORTED,
    LOCALE_LABELS: LOCALE_LABELS,
    t: t,
    init: init,
    setLocale: setLocale,
    getLocale: getLocale,
    isReady: isReady,
    applyTranslations: applyTranslations,
    saveLocaleToProfile: saveLocaleToProfile,
    normalizeLocale: normalizeLocale,
    languageName: languageName,
    openAiLanguageInstruction: openAiLanguageInstruction,
    passportLanguageForLocale: function (code) {
      return PASSPORT_LANGUAGE_MAP[normalizeLocale(code)] || "English";
    },
  };
})(window);
