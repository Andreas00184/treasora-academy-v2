(function () {
  var form = document.getElementById("signup-form");
  if (!form) return;

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

    if (password !== confirmPassword) {
      errorEl.textContent = "Passwords don't match — please check and try again.";
      errorEl.style.display = "block";
      return;
    }

    if (!window.SUPABASE_CONFIGURED) {
      errorEl.textContent =
        "This site isn't connected to a real backend yet — signup is disabled in this preview.";
      errorEl.style.display = "block";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Creating your account...";

    var result = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { full_name: (firstName + " " + lastName).trim() },
      },
    });

    btn.disabled = false;
    btn.textContent = "Create My Free Account";

    if (result.error) {
      errorEl.textContent = result.error.message;
      errorEl.style.display = "block";
      return;
    }

    window.location.href = "passport.html";
  });
})();
