(function () {
  var form = document.getElementById("signin-form");
  if (!form) return;

  async function boot() {
    if (window.TreasoraI18n) await TreasoraI18n.init();
    TreasoraAuth.redirectIfAuthed("dashboard.html");

    var errorEl = document.getElementById("signin-error");
    var btn = document.getElementById("signin-submit-btn");

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      errorEl.style.display = "none";

      var email = document.getElementById("email").value.trim();
      var password = document.getElementById("password").value;

      if (!window.SUPABASE_CONFIGURED) {
        errorEl.textContent = TreasoraI18n.t("auth.signInPreview");
        errorEl.style.display = "block";
        return;
      }

      btn.disabled = true;
      btn.textContent = TreasoraI18n.t("auth.signInBtnLoading");

      var result = await supabaseClient.auth.signInWithPassword({ email: email, password: password });

      btn.disabled = false;
      btn.textContent = TreasoraI18n.t("auth.signInBtn");

      if (result.error) {
        errorEl.textContent = TreasoraI18n.t("auth.signInError");
        errorEl.style.display = "block";
        return;
      }

      var profile = await TreasoraAuth.getProfile();
      if (profile && profile.ui_language) {
        await TreasoraI18n.setLocale(profile.ui_language);
      }

      window.location.href = "dashboard.html";
    });
  }

  boot();
})();
