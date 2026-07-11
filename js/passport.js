/**
 * Financial Passport: auth guard, pre-fill, save.
 */
(function (global) {
  document.querySelectorAll(".chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      document.querySelectorAll(".chip").forEach(function (c) {
        c.classList.remove("active");
      });
      chip.classList.add("active");
      var goalField = document.getElementById("goal");
      if (goalField) goalField.value = chip.getAttribute("data-goal");
    });
  });

  async function loadExisting() {
    if (!global.TreasoraAuth || !global.TreasoraSupabase) return;
    var session = await global.TreasoraAuth.requireAuth("sign-in.html");
    if (!session) return;

    var client = global.TreasoraSupabase.client;
    if (!client) return;

    var result = await client
      .from("financial_passports")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (result.error || !result.data) return;

    var p = result.data;
    setValue("level", p.knowledge_level);
    setValue("language", p.preferred_language);
    setValue("pace", p.learning_pace);
    setValue("goal", p.biggest_goal);
    setValue("country", p.country);
    setValue("portfolio-interests", p.portfolio_interests);
    setValue("favorite-investments", p.favorite_investments);

    document.querySelectorAll(".chip").forEach(function (chip) {
      if (chip.getAttribute("data-goal") === p.biggest_goal) {
        chip.classList.add("active");
      }
    });

    var ctaSection = document.getElementById("cta-section");
    if (ctaSection) ctaSection.hidden = false;
  }

  function setValue(id, val) {
    var el = document.getElementById(id);
    if (el && val) el.value = val;
  }

  var passportForm = document.getElementById("passport-form");
  var formError = document.getElementById("form-error");
  var ctaSection = document.getElementById("cta-section");

  if (passportForm) {
    passportForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      var level = document.getElementById("level").value.trim();
      var language = document.getElementById("language").value.trim();
      var pace = document.getElementById("pace").value.trim();
      var goal = document.getElementById("goal").value.trim();
      var country = document.getElementById("country").value.trim();
      var portfolioInterests = document.getElementById("portfolio-interests").value.trim();
      var favoriteInvestments = document.getElementById("favorite-investments").value.trim();

      if (!level || !language || !pace || !goal) {
        formError.hidden = false;
        formError.textContent = "Please fill in every required field above so Dominar can build your path.";
        formError.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      if (!global.SUPABASE_CONFIGURED) {
        formError.hidden = false;
        formError.textContent =
          "This site isn't connected to a real backend yet — your Passport can't be saved in this preview.";
        formError.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      var userResult = await global.supabaseClient.auth.getUser();
      var user = userResult.data.user;
      if (!user) {
        formError.hidden = false;
        formError.textContent = "Please sign in first — your session may have expired.";
        formError.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      var payload = {
        user_id: user.id,
        knowledge_level: level,
        preferred_language: language,
        learning_pace: pace,
        biggest_goal: goal,
        country: country || null,
        portfolio_interests: portfolioInterests || null,
        favorite_investments: favoriteInvestments || null,
      };

      var result = await global.supabaseClient.from("financial_passports").upsert(payload);

      if (result.error) {
        formError.hidden = false;
        formError.textContent = "Something went wrong saving your Passport: " + result.error.message;
        formError.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      formError.hidden = true;
      ctaSection.hidden = false;
      ctaSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  document.addEventListener("DOMContentLoaded", loadExisting);
})(window);
