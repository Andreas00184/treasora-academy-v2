(function () {
  var form = document.getElementById("signup-form");
  if (!form) return;

  var PUBLIC_LOCALES = ["en", "es"];

  function normalizeLocale(code) {
    return PUBLIC_LOCALES.indexOf(code) >= 0 ? code : "en";
  }

  function syncLanguageRadios(locale) {
    locale = normalizeLocale(locale);
    document.querySelectorAll('input[name="ui-language"]').forEach(function (radio) {
      radio.checked = radio.value === locale;
    });
  }

  function wireLanguageRadios() {
    document.querySelectorAll('input[name="ui-language"]').forEach(function (radio) {
      radio.addEventListener("change", async function () {
        if (!radio.checked || !window.TreasoraI18n) return;
        await TreasoraI18n.setLocale(normalizeLocale(radio.value));
      });
    });

    document.addEventListener("treasora:locale-changed", function (event) {
      var locale =
        event.detail && event.detail.locale
          ? event.detail.locale
          : window.TreasoraI18n
            ? TreasoraI18n.getLocale()
            : "en";
      syncLanguageRadios(locale);
    });
  }

  async function boot() {
    if (window.TreasoraI18n) await TreasoraI18n.init();
    syncLanguageRadios(
      window.TreasoraI18n ? TreasoraI18n.getLocale() : "en"
    );
    wireLanguageRadios();
    TreasoraAuth.redirectIfAuthed("dashboard.html");

    var errorEl = document.getElementById("signup-error");
    var btn = document.getElementById("signup-submit-btn");

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      errorEl.style.display = "none";

      var firstName = document.getElementById("first-name").value.trim();
      var lastName = document.getElementById("last-name").value.trim();
      var email = document.getElementById("email").value.trim();
      var password = document.getElementById("password").value;
      var confirmPassword = document.getElementById("confirm-password").value;
      var langEl = document.querySelector('input[name="ui-language"]:checked');
      var uiLanguage = normalizeLocale(langEl ? langEl.value : "en");

      if (password !== confirmPassword) {
        errorEl.textContent = TreasoraI18n.t("auth.passwordMismatch");
        errorEl.style.display = "block";
        return;
      }

      if (!window.SUPABASE_CONFIGURED) {
        errorEl.textContent = TreasoraI18n.t("auth.signUpPreview");
        errorEl.style.display = "block";
        return;
      }

      btn.disabled = true;
      btn.textContent = TreasoraI18n.t("auth.signUpBtnLoading");

      var result = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: (firstName + " " + lastName).trim(),
            ui_language: uiLanguage,
          },
        },
      });

      btn.disabled = false;
      btn.textContent = TreasoraI18n.t("auth.signUpBtn");

      if (result.error) {
        errorEl.textContent = result.error.message;
        errorEl.style.display = "block";
        return;
      }

      if (result.data.user) {
        await supabaseClient
          .from("profiles")
          .update({ ui_language: uiLanguage })
          .eq("id", result.data.user.id);
      }

      await TreasoraI18n.setLocale(uiLanguage);
      window.location.href = "passport.html";
    });
  }

  boot();
})();
