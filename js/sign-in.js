(function () {
  var form = document.getElementById("signin-form");
  if (!form) return;

  TreasoraAuth.redirectIfAuthed("dashboard.html");

  var errorEl = document.getElementById("signin-error");
  var btn = document.getElementById("signin-submit-btn");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorEl.style.display = "none";

    var email = document.getElementById("email").value.trim();
    var password = document.getElementById("password").value;

    if (!window.SUPABASE_CONFIGURED) {
      errorEl.textContent =
        "This site isn't connected to a real backend yet — sign in is disabled in this preview.";
      errorEl.style.display = "block";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Signing in...";

    var result = await supabaseClient.auth.signInWithPassword({ email: email, password: password });

    btn.disabled = false;
    btn.textContent = "Sign In";

    if (result.error) {
      errorEl.textContent = "Incorrect email or password. Please try again.";
      errorEl.style.display = "block";
      return;
    }

    window.location.href = "dashboard.html";
  });
})();
