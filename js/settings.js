(function () {
  async function boot() {
    await TreasoraI18n.init();
    var session = await TreasoraAuth.requireAuth("sign-in.html");
    if (!session) return;

    var profile = await TreasoraAuth.getProfile();
    var locale = TreasoraI18n.getLocale();
    if (profile && profile.ui_language) {
      locale = TreasoraI18n.normalizeLocale(profile.ui_language);
    }

    document.querySelectorAll('input[name="ui-language"]').forEach(function (radio) {
      radio.checked = radio.value === locale;
      radio.closest(".lang-option").classList.toggle("selected", radio.checked);
      radio.addEventListener("change", function () {
        document.querySelectorAll(".lang-option").forEach(function (el) {
          el.classList.remove("selected");
        });
        radio.closest(".lang-option").classList.add("selected");
      });
    });

    var saveBtn = document.getElementById("save-language-btn");
    var msg = document.getElementById("lang-msg");

    saveBtn.addEventListener("click", async function () {
      var selected = document.querySelector('input[name="ui-language"]:checked');
      if (!selected) return;
      saveBtn.disabled = true;
      saveBtn.textContent = TreasoraI18n.t("settings.saving");
      msg.className = "msg";
      msg.style.display = "none";

      var result = await TreasoraI18n.saveLocaleToProfile(selected.value);
      saveBtn.disabled = false;
      saveBtn.textContent = TreasoraI18n.t("settings.saveLanguage");

      if (result.ok) {
        msg.textContent = TreasoraI18n.t("language.saved");
        msg.className = "msg ok";
      } else {
        msg.textContent = TreasoraI18n.t("language.saveFailed");
        msg.className = "msg err";
      }
    });

    document.getElementById("sign-out-btn").addEventListener("click", function () {
      TreasoraAuth.signOut();
    });

    var manageBtn = document.getElementById("settings-manage-sub");
    var upgradeLink = document.getElementById("settings-upgrade");
    var isPro = profile && (profile.is_pro || profile.current_plan === "pro");
    if (profile && profile.stripe_customer_id && manageBtn) {
      manageBtn.style.display = "inline-flex";
      manageBtn.addEventListener("click", function () {
        TreasoraBilling.openBillingPortal(window.location.href);
      });
    }
    if (!isPro && upgradeLink) {
      upgradeLink.style.display = "inline-flex";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
